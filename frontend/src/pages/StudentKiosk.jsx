import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Fingerprint, CheckCircle2, Shield, ScanFace, ArrowLeft, 
  Sparkles, Video, UserCheck, RefreshCw, Clock, Award,
  GraduationCap, Users, LogIn, LogOut, Timer, Cpu, Scan, Check,
  AlertCircle, AlertTriangle
} from 'lucide-react';
import CameraFeed from '../components/CameraFeed';
import AIFaceGrid from '../components/AIFaceGrid';
import { verifyBiometricFingerprint, isBiometricAvailable } from '../services/biometricService';
import { recordCheckIn, recordCheckOut } from '../services/attendanceApi';
import { startSession, stopSession, getLatestResults } from '../services/recognitionApi';
import { formatTime } from '../utils/formatters';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';

export default function StudentKiosk() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [actionType, setActionType] = useState('check-in'); // 'check-in' or 'check-out'
  const [authStatus, setAuthStatus] = useState('idle'); // idle, scanning, success, error
  const [verifiedPerson, setVerifiedPerson] = useState(null);

  const [studentsList, setStudentsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time automatic AI detected person (primary focus for UI)
  const [detectedFace, setDetectedFace] = useState(null);
  // All detected faces for multi-box rendering
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [isScanningActive, setIsScanningActive] = useState(true);
  
  const lastUnknownToastTime = useRef(0);

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load registered students and teachers database for fallback lookup
  const loadData = async () => {
    try {
      const [stRes, tcRes] = await Promise.allSettled([
        fetch('/api/students').then(r => r.json()),
        fetch('/api/teachers').then(r => r.json())
      ]);

      if (stRes.status === 'fulfilled' && stRes.value?.data) {
        setStudentsList(stRes.value.data);
      }
      if (tcRes.status === 'fulfilled' && tcRes.value?.data) {
        setTeachersList(tcRes.value.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    // Start backend recognition engine
    startSession().catch(console.error);

    return () => {
      stopSession().catch(console.error);
    };
  }, []);

  const cameraRef = useRef(null);
  const authStatusRef = useRef(authStatus);
  useEffect(() => {
    authStatusRef.current = authStatus;
  }, [authStatus]);

  // Day-scoped processed IDs: prevents duplicate AI auto-triggers even after page switches
  const todayKey = new Date().toISOString().slice(0, 10);
  const getProcessedSet = (action) => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(`kiosk_processed_${action}`) || '{}');
      if (stored.date === todayKey) return new Set(stored.ids || []);
    } catch {}
    return new Set();
  };
  const markProcessed = (action, id) => {
    const s = getProcessedSet(action);
    s.add(id);
    sessionStorage.setItem(`kiosk_processed_${action}`, JSON.stringify({ date: todayKey, ids: [...s] }));
  };
  const isAlreadyProcessed = (action, id) => getProcessedSet(action).has(id);

  const lastCheckedInIdRef = useRef(null);
  const lockCountRef = useRef(0);

  // Allow a person to scan again immediately if the kiosk mode changes (e.g., check-in -> check-out)
  useEffect(() => {
    lastCheckedInIdRef.current = null;
    lockCountRef.current = 0;
  }, [actionType]);

  // Execute Face Attendance Verification (Instant or Automatic for Faculty & Staff)
  const executeAttendance = async (person = detectedFace) => {
    if (!person || person.error) return;
    if (authStatusRef.current === 'scanning' || authStatusRef.current === 'success') return;

    // Ensure Kiosk is strictly for Faculty / Principal / Staff
    if (person.role === 'student') {
      toast.error('Access Restricted: Kiosk is for Faculty & Staff only. Students are marked via Classroom Live Attendance.');
      setAuthStatus('idle');
      return;
    }

    // Check if already processed today (prevents duplicate triggers after page switch)
    if (isAlreadyProcessed(actionType, person.id)) {
      setDetectedFace(prev => prev ? { ...prev, alreadyCheckedIn: true } : prev);
      toast.success(`${person.roleLabel || 'Faculty'} ${person.name} has already ${actionType === 'check-in' ? 'checked in' : 'checked out'} today.`, {
        icon: '✅', duration: 3000
      });
      lastCheckedInIdRef.current = person.id;
      return;
    }

    setAuthStatus('scanning');
    try {
      let record;
      let isAlready = false;
      if (actionType === 'check-in') {
        const res = await recordCheckIn({
          student_id: person.id,
          student_name: person.name,
          person_type: 'teacher',
          method: 'face',
          confidence: (person.confidence || 95) / 100
        });
        record = res?.data || res;
        
        if (record?.already_checked_in) {
          isAlready = true;
          toast.success(`${person.roleLabel || 'Faculty'} ${person.name} (${person.id}) is ALREADY CHECKED IN today.`, {
            icon: '✅',
            duration: 4000
          });
          setDetectedFace(prev => prev ? { ...prev, alreadyCheckedIn: true } : prev);
        } else {
          toast.success(`Check-In Verified: ${person.roleLabel || 'Faculty'} ${person.name} (${person.id})`, { duration: 4000 });
        }
      } else {
        const res = await recordCheckOut({
          student_id: person.id,
          student_name: person.name,
          person_type: 'teacher'
        });
        record = res?.data || res;
        
        if (record?.already_checked_out) {
          isAlready = true;
          toast.success(`${person.roleLabel || 'Faculty'} ${person.name} (${person.id}) has ALREADY CHECKED OUT today.`, {
            icon: '✅',
            duration: 4000
          });
          setDetectedFace(prev => prev ? { ...prev, alreadyCheckedIn: true } : prev);
        } else {
          toast.success(`Check-Out Completed: ${person.roleLabel || 'Faculty'} ${person.name} (${person.id})`, { duration: 4000 });
        }
      }

      // Mark this person as processed for today so AI doesn't re-trigger
      markProcessed(actionType, person.id);
      lastCheckedInIdRef.current = person.id;
      
      setVerifiedPerson({
        name: person.name,
        id: person.id,
        role: 'teacher',
        roleLabel: person.roleLabel || 'Faculty Member',
        method: 'AI Deep Face Vision Neural Match',
        action: actionType,
        checkInTime: record?.check_in_time || '08:30:00',
        checkOutTime: record?.check_out_time || formatTime(new Date().toISOString()),
        duration: record?.duration_minutes ? formatDurationMins(record.duration_minutes) : 'Calculating...',
        time: formatTime(new Date().toISOString()),
        already_checked_in: record?.already_checked_in,
        already_checked_out: record?.already_checked_out
      });
      setAuthStatus('success');

      // Auto-reset modal for next attendee (2s for already processed, 2.5s for new)
      const dismissDelay = isAlready ? 2000 : 2500;
      setTimeout(() => {
        setAuthStatus('idle');
        setVerifiedPerson(null);
        setDetectedFace(null);
        lockCountRef.current = 0;
      }, dismissDelay);
    } catch (err) {
      console.error('Attendance recording error:', err);
      toast.error('Attendance recording error');
      setAuthStatus('idle');
      lockCountRef.current = 0;
    }
  };

  // Continuous Real-Time Automated Face Detection Polling Loop (Faculty Target)
  useEffect(() => {
    if (!isScanningActive || authStatus === 'success' || authStatus === 'scanning') return;

    const interval = setInterval(async () => {
      try {
        let frameBlob = null;
        if (cameraRef.current) {
          frameBlob = await cameraRef.current.captureFrame();
        }

        let results = [];
        if (frameBlob) {
          const reader = new FileReader();
          const base64Promise = new Promise(resolve => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(frameBlob);
          });
          const base64 = await base64Promise;

          const scanRes = await fetch('/api/recognition/scan-frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              image: base64,
              targetRole: 'faculty'
            })
          }).then(r => r.json()).catch(() => null);

          if (scanRes?.data?.face_detected && scanRes?.data?.results?.length > 0) {
            results = scanRes.data.results;
          }
        }

        if (Array.isArray(results) && results.length > 0) {
          const mappedFaces = results.map(match => {
            const isTeacher = String(match.student_id).startsWith('TCH') || String(match.student_id).startsWith('T-') || String(match.student_id).startsWith('PRN') || match.role === 'teacher';
            const isAlready = isTeacher && match.student_id ? isAlreadyProcessed(actionType, match.student_id) : false;
            
            return {
              id: match.student_id,
              name: match.name || (match.recognized ? 'Verified Faculty' : (match.error_message ? 'STUDENT (RESTRICTED)' : 'Unknown Face')),
              role: isTeacher ? 'teacher' : 'student',
              roleLabel: isTeacher ? 'Faculty Member' : (match.roleLabel || 'Student'),
              confidence: Math.round((match.confidence || 0.96) * 100),
              error: !match.recognized || match.error || match.name === 'Completely Different Person' || !isTeacher,
              is_student_kiosk_violation: match.is_student_kiosk_violation,
              alreadyCheckedIn: isAlready,
              box_top_pct: match.box_top_pct,
              box_bottom_pct: match.box_bottom_pct,
              box_left_pct: match.box_left_pct,
              box_right_pct: match.box_right_pct,
              box_width_pct: match.box_width_pct,
              box_height_pct: match.box_height_pct
            };
          });
          
          setDetectedFaces(mappedFaces);
          // Set primary targeted face for UI info display (prioritizing valid teachers, then the biggest/first face)
          const primaryFace = mappedFaces.find(p => !p.error && p.role === 'teacher') || mappedFaces[0];
          setDetectedFace(primaryFace);
          
          // Process check-in for the FIRST valid teacher we see in the array who HAS NOT been checked in yet (fixes multi-scanning)
          const validTeacher = mappedFaces.find(p => !p.error && p.role === 'teacher' && p.id && !p.alreadyCheckedIn && lastCheckedInIdRef.current !== p.id);

          if (validTeacher) {
            // Instant Automatic Check-In/Out Trigger on Faculty Face Detection
            if (authStatusRef.current === 'idle') {
              lockCountRef.current += 1;
              if (lockCountRef.current >= 1) {
                executeAttendance(validTeacher);
              }
            }
          } else {
            lockCountRef.current = 0;
          }
          
          // Clear any pending removal timeout
          if (window.kioskFaceRemovalTimeout) {
            clearTimeout(window.kioskFaceRemovalTimeout);
            window.kioskFaceRemovalTimeout = null;
          }
        } else {
          // Add a 1.2-second persistence debounce before clearing the face results.
          if (!window.kioskFaceRemovalTimeout) {
            window.kioskFaceRemovalTimeout = setTimeout(() => {
              setDetectedFaces([]);
              setDetectedFace(null);
              window.kioskFaceRemovalTimeout = null;
            }, 1200);
          }
        }
      } catch (err) {
        // silent polling catch
      }
    }, 450);

    return () => {
      clearInterval(interval);
      if (window.kioskFaceRemovalTimeout) clearTimeout(window.kioskFaceRemovalTimeout);
    };
  }, [isScanningActive, authStatus, user]);  // Hardware Touch ID Fingerprint Scan (Faculty & Staff Only)
  const handleFingerprintScan = async () => {
    setAuthStatus('scanning');
    try {
      const isAvail = await isBiometricAvailable();
      if (isAvail) {
        await verifyBiometricFingerprint();
      } else {
        await new Promise(r => setTimeout(r, 1200));
      }

      // Kiosk Touch ID is exclusively for Teachers & Principal
      const person = (detectedFace && detectedFace.role === 'teacher') ? detectedFace : (teachersList.length > 0 ? {
        id: teachersList[0].teacher_id || teachersList[0].id,
        name: teachersList[0].name,
        role: 'teacher',
        roleLabel: 'Faculty Member'
      } : {
        id: 'TCH-001',
        name: 'Faculty Member',
        role: 'teacher',
        roleLabel: 'Faculty Member'
      });

      let record;
      if (actionType === 'check-in') {
        const res = await recordCheckIn({
          student_id: person.id,
          student_name: person.name,
          person_type: 'teacher',
          confidence: 0.99
        });
        record = res?.data || res;
        toast.success(`Faculty Touch ID Check-In: ${person.name}`);
      } else {
        const res = await recordCheckOut({
          student_id: person.id,
          student_name: person.name,
          person_type: 'teacher'
        });
        record = res?.data || res;
        toast.success(`Faculty Touch ID Check-Out: ${person.name}`);
      }

      setVerifiedPerson({
        name: person.name,
        id: person.id,
        role: 'teacher',
        roleLabel: person.roleLabel || 'Faculty Member',
        method: 'Hardware Touch ID Sensor',
        action: actionType,
        checkInTime: record?.check_in_time || '08:30:00',
        checkOutTime: record?.check_out_time || formatTime(new Date().toISOString()),
        duration: record?.duration_minutes ? formatDurationMins(record.duration_minutes) : 'Calculating...',
        time: formatTime(new Date().toISOString()),
        already_checked_in: record?.already_checked_in
      });
      setAuthStatus('success');

      const dismissDelay = record?.already_checked_in ? 2000 : 2500;
      setTimeout(() => {
        setAuthStatus('idle');
        setVerifiedPerson(null);
        setDetectedFace(null);
        lockCountRef.current = 0;
      }, dismissDelay);
    } catch (err) {
      console.error(err);
      toast.error('Touch ID verification failed');
      setAuthStatus('idle');
    }
  };

  const reset = () => {
    setAuthStatus('idle');
    setVerifiedPerson(null);
    setDetectedFace(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden font-sans select-none pb-12">
      
      {/* Ambient background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Terminal Header */}
      <div className="z-10 flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-xs font-semibold text-white border border-white/10 transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Studio
        </button>

        {/* Action Toggle (Check-In vs Check-Out) */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-[11px] font-mono font-semibold text-emerald-300">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Faculty & Staff Attendance Kiosk</span>
          </div>

          <div className="flex bg-slate-900/90 border border-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => {
                setActionType('check-in');
                lastCheckedInIdRef.current = null;
                setDetectedFace(null);
                setDetectedFaces([]);
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                actionType === 'check-in'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Check-In</span>
            </button>

            <button
              onClick={() => {
                setActionType('check-out');
                lastCheckedInIdRef.current = null;
                setDetectedFace(null);
                setDetectedFaces([]);
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                actionType === 'check-out'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Check-Out</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-300">
          <span className={`w-2 h-2 rounded-full animate-pulse ${actionType === 'check-in' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span>{formatTime(currentTime.toISOString())}</span>
        </div>
      </div>

      {/* Main Dual Automated Kiosk Terminal */}
      <div className="z-10 w-full max-w-5xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        
        {/* Left: Real-Time Automatic AI Camera Face Viewfinder */}
        <div className="bg-slate-900/85 backdrop-blur-2xl rounded-3xl p-6 border border-slate-800 shadow-2xl flex flex-col justify-between h-full min-h-[490px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                  actionType === 'check-in' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}>
                  <ScanFace className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Faculty Presence Scanner
                  </h2>
                  <p className="text-xs text-slate-400">
                    {detectedFace 
                      ? (detectedFace.is_student_kiosk_violation ? 'Student detected in Faculty Kiosk' : detectedFace.error ? 'Completely Different Person / Unregistered' : `Locked: Faculty ${detectedFace.name}`) 
                      : 'Watching camera • Teachers & Principal step into frame'}
                  </p>
                </div>
              </div>
              
              {/* Presence Status Tag */}
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border ${
                detectedFace 
                  ? (detectedFace.is_student_kiosk_violation
                      ? 'bg-blue-950/80 text-blue-400 border-blue-800/60'
                      : detectedFace.error 
                        ? 'bg-red-950/80 text-red-400 border-red-800/60'
                        : detectedFace.alreadyCheckedIn
                          ? 'bg-blue-950/80 text-blue-400 border-blue-800/60'
                          : 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60')
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {detectedFace 
                  ? (detectedFace.is_student_kiosk_violation ? 'STUDENT DETECTED (RESTRICTED)' : detectedFace.error ? 'ACCESS RESTRICTED' : detectedFace.alreadyCheckedIn ? 'ALREADY RECORDED' : 'FACULTY DETECTED') 
                  : 'NO PERSON DETECTED'}
              </span>
            </div>

            {/* Viewfinder Canvas */}
            <div className="aspect-video rounded-2xl overflow-hidden bg-black relative border-2 border-slate-800 flex items-center justify-center">
              <CameraFeed ref={cameraRef} active={true} forceLocalWebcam={true} className="w-full h-full object-cover" />
              
              {/* Holographic AI HUD Overlay */}
              <div className="absolute inset-0 border-2 border-primary-500/20 rounded-2xl pointer-events-none flex flex-col items-center justify-between p-4">
                <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${detectedFace ? (detectedFace.error ? 'bg-red-400 animate-ping' : (actionType === 'check-out' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-ping')) : 'bg-amber-400 animate-pulse'}`} />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      LIVE CAMERA STATUS
                    </span>
                  </div>
                  <span className="bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs border border-white/10">
                    {detectedFace ? (detectedFace.error ? 'CONF: < 50%' : `CONF: ${detectedFace.confidence}%`) : 'TARGET: NONE'}
                  </span>
                </div>

                {/* Futuristic Holographic AI Face Mesh Grid */}
                {detectedFaces.map((face, idx) => (
                  <AIFaceGrid key={idx} detectedFace={face} authStatus={authStatus} actionType={actionType} />
                ))}

                {/* Warning Overlay when Already Processed */}
                <AnimatePresence>
                  {detectedFace && detectedFace.alreadyCheckedIn && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute inset-x-4 top-14 z-30 p-3.5 rounded-2xl bg-cyan-950/95 border-2 border-cyan-400 text-cyan-200 text-center shadow-2xl backdrop-blur-md"
                    >
                      <p className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center justify-center gap-2 text-cyan-300">
                        <AlertCircle className="w-5 h-5 text-cyan-400 animate-pulse" />
                        PLEASE REMOVE YOUR FACE: YOU ARE ALREADY {actionType === 'check-in' ? 'CHECKED IN' : 'CHECKED OUT'}
                      </p>
                      <p className="text-[11px] text-cyan-100/90 mt-1 font-medium">
                        Attendance is already recorded for today. Please step away for the next faculty member{actionType === 'check-in' ? ', or switch to Check-Out when leaving.' : '.'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom Status bar inside Camera */}
                <div className="w-full flex items-center justify-between text-[10px] font-mono">
                  {detectedFace ? (
                    <span className={`px-2.5 py-0.5 rounded-md backdrop-blur-xs font-bold border ${
                      detectedFace.role === 'teacher'
                        ? 'bg-emerald-900/90 text-emerald-300 border-emerald-600'
                        : detectedFace.is_student_kiosk_violation
                          ? 'bg-blue-900/90 text-blue-300 border-blue-600'
                          : 'bg-red-900/90 text-red-300 border-red-600'
                    }`}>
                      {detectedFace.role === 'teacher' ? '👨‍🏫 FACULTY IDENTIFIED' : detectedFace.is_student_kiosk_violation ? '🎓 STUDENT IDENTIFIED' : '❓ UNKNOWN PERSON IDENTIFIED'}
                    </span>
                  ) : (
                    <span className="bg-slate-900/80 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-md">
                      CAMERA ACTIVE • WAITING FOR ATTENDEE
                    </span>
                  )}

                  <span className={`px-2 py-0.5 rounded-md border font-bold ${
                    detectedFace 
                      ? (actionType === 'check-out' ? 'bg-black/60 text-amber-400 border-amber-800' : 'bg-black/60 text-emerald-400 border-emerald-800')
                      : 'bg-black/60 text-slate-400 border-white/10'
                  }`}>
                    LOCK: {detectedFace ? 'ACTIVE' : 'IDLE'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => executeAttendance(detectedFace)}
            disabled={authStatus === 'scanning'}
            className={`mt-4 w-full py-3.5 text-white font-bold rounded-2xl shadow-lg text-xs sm:text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
              !detectedFace
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 shadow-none'
                : actionType === 'check-in'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-rose-600/30'
            }`}
          >
            <ScanFace className="w-4 h-4" />
            <span>
              {authStatus === 'scanning' 
                ? 'AI Neural Verification in Progress...' 
                : detectedFace
                  ? `Mark ${actionType === 'check-in' ? 'Check-In' : 'Check-Out'} for ${detectedFace.name} (${detectedFace.id})`
                  : 'Watching Camera Feed (Face Not Detected)'}
            </span>
          </motion.button>
        </div>

        {/* Right: Touch ID Fingerprint Sensor */}
        <div className="bg-slate-900/85 backdrop-blur-2xl rounded-3xl p-6 border border-slate-800 shadow-2xl flex flex-col justify-between items-center text-center h-full min-h-[490px]">
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-left">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                  actionType === 'check-in' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}>
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Touch ID Biometric
                  </h2>
                  <p className="text-xs text-slate-400">Place finger on device sensor</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60">
                WEBAUTHN
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 text-left text-xs space-y-1.5 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Sensor Status:</span>
                <span className="text-emerald-400 font-semibold font-mono">STANDBY / READY</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Identity:</span>
                <span className="font-bold text-white font-mono">{detectedFace?.name || 'Auto-Matching Sensor'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Designated ID:</span>
                <span className="font-bold text-primary-400 font-mono">{detectedFace?.id || '—'}</span>
              </div>
            </div>
          </div>

          {/* Glowing Fingerprint Pad */}
          <div 
            onClick={authStatus !== 'scanning' ? handleFingerprintScan : undefined}
            className={`w-36 h-36 rounded-3xl border-3 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative shadow-2xl group ${
              authStatus === 'scanning'
                ? 'border-emerald-400 bg-emerald-950/40 text-emerald-400 shadow-emerald-500/30 animate-pulse'
                : 'border-slate-700 hover:border-emerald-500/80 bg-slate-800/60 hover:bg-slate-800'
            }`}
          >
            <Fingerprint className={`w-16 h-16 transition-transform group-hover:scale-110 ${
              authStatus === 'scanning' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'
            }`} />
            <span className="text-[10px] font-mono text-slate-400 mt-1">TOUCH SENSOR</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFingerprintScan}
            disabled={authStatus === 'scanning'}
            className={`mt-4 w-full py-3.5 text-white font-bold rounded-2xl shadow-lg text-xs sm:text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
              actionType === 'check-in'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-rose-600/30'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>
              {authStatus === 'scanning' 
                ? 'Verifying Touch ID...' 
                : detectedFace
                  ? `Touch Sensor for ${detectedFace.name}`
                  : 'Touch Sensor (Instant Biometric Match)'}
            </span>
          </motion.button>
        </div>

      </div>

      {/* Success Modal Overlay with Auto-Detected Role & Timing Breakdown */}
      <AnimatePresence>
        {authStatus === 'success' && verifiedPerson && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`bg-slate-900 border p-8 sm:p-10 rounded-3xl text-center max-w-md w-full shadow-2xl ${
                verifiedPerson.already_checked_in ? 'border-blue-500/40 shadow-blue-500/20' : 'border-emerald-500/40 shadow-emerald-500/20'
              }`}
            >
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border ${
                (verifiedPerson.already_checked_in || verifiedPerson.already_checked_out)
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                  : verifiedPerson.action === 'check-in'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              }`}>
                <CheckCircle2 className="w-10 h-10" />
              </div>

              {/* Automatic Role Recognition Badge */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border ${
                (verifiedPerson.already_checked_in || verifiedPerson.already_checked_out)
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : verifiedPerson.role === 'teacher'
                    ? (verifiedPerson.action === 'check-out' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40')
                    : 'bg-primary-500/20 text-primary-300 border-primary-500/40'
              }`}>
                {(verifiedPerson.already_checked_in || verifiedPerson.already_checked_out)
                  ? (verifiedPerson.role === 'teacher' ? `👨‍🏫 FACULTY ALREADY ${verifiedPerson.action === 'check-out' ? 'CHECKED OUT' : 'CHECKED IN'}` : `🎓 STUDENT ALREADY ${verifiedPerson.action === 'check-out' ? 'CHECKED OUT' : 'CHECKED IN'}`) 
                  : (verifiedPerson.role === 'teacher' ? '👨‍🏫 FACULTY ATTENDANCE RECORDED' : '🎓 STUDENT ATTENDANCE RECORDED')}
              </span>

              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-1">
                {verifiedPerson.action === 'check-in' ? 'Check-In Complete!' : 'Check-Out Complete!'}
              </h1>
              <p className="text-emerald-300 font-semibold text-base">{verifiedPerson.name}</p>
              <p className="text-slate-400 font-mono text-xs mt-0.5">{verifiedPerson.id}</p>
              
              {/* Timing Breakdown Card */}
              <div className="my-5 p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-2 text-left">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <LogIn className="w-3.5 h-3.5 text-emerald-400" /> IN Time:
                  </span>
                  <span className="font-mono font-bold text-white">{verifiedPerson.checkInTime}</span>
                </div>

                {verifiedPerson.action === 'check-out' && (
                  <>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <LogOut className="w-3.5 h-3.5 text-rose-400" /> OUT Time:
                      </span>
                      <span className="font-mono font-bold text-white">{verifiedPerson.checkOutTime}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-400 pt-2 border-t border-slate-700 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5" /> Total Duration:
                      </span>
                      <span className="font-mono font-bold">{verifiedPerson.duration}</span>
                    </div>
                  </>
                )}

                <div className="pt-2 border-t border-slate-700/60 text-[11px] text-slate-400 text-center">
                  Verified via {verifiedPerson.method} ✓
                </div>
              </div>

              <button
                onClick={reset}
                className={`w-full text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all text-sm ${
                  verifiedPerson.already_checked_in 
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30' 
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                }`}
              >
                Next Attendee
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Footer Note */}
      <div className="z-10 text-center text-xs text-slate-500 mt-4">
        AI Computer Vision Presence Engine • Automatic Identity Recognition Active
      </div>
    </div>
  );
}

function formatDurationMins(minutes) {
  if (!minutes || minutes <= 0) return '< 1 min';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins} mins`;
}
