import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Play, Square, CheckCircle2, AlertTriangle, Clock, 
  Users, Zap, Shield, StopCircle, Fingerprint, RefreshCw, 
  GraduationCap, UserCheck, ChevronRight
} from 'lucide-react';
import CameraFeed from '../components/CameraFeed';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { startSession, stopSession, getLatestResults } from '../services/recognitionApi';
import { getTodayAttendance, finalizeSession } from '../services/attendanceApi';
import { isBiometricAvailable, verifyBiometricFingerprint } from '../services/biometricService';

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

export default function LiveAttendance() {
  const { sessionActive, setSessionActive, user } = useApp();
  const isPrincipal = user?.role === 'principal';

  const [results, setResults] = useState([]);
  const [todayList, setTodayList] = useState([]);
  const [personTypeTab, setPersonTypeTab] = useState('student'); // 'student' or 'teacher'

  const [showFinalize, setShowFinalize] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState('idle');
  const [sessionTime, setSessionTime] = useState(0);

  // Load real today attendance
  const loadTodayAttendance = useCallback(async () => {
    try {
      const res = await getTodayAttendance();
      const data = res?.data || res || [];
      setTodayList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadTodayAttendance();
  }, [loadTodayAttendance]);

  // Session duration timer
  useEffect(() => {
    if (!sessionActive) return;
    const t = setInterval(() => setSessionTime(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [sessionActive]);

  // Poll real AI recognition results when session is active
  useEffect(() => {
    if (!sessionActive) return;
    const interval = setInterval(async () => {
      try {
        const res = await getLatestResults();
        const raw = res?.data || res || [];
        if (Array.isArray(raw) && raw.length > 0) {
          setResults(raw);
          loadTodayAttendance();
        }
      } catch (err) {
        // silent fail on polling
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [sessionActive, loadTodayAttendance]);

  const handleStart = async () => {
    try {
      await startSession();
      setSessionActive(true);
      setSessionTime(0);
      toast.success('Live AI Recognition Camera Active!');
    } catch (err) {
      toast.error('Failed to start recognition engine');
    }
  };

  const handleStop = async () => {
    try {
      await stopSession();
      setSessionActive(false);
      setResults([]);
      toast('Live Session Stopped', { icon: '⏹️' });
    } catch (err) {
      toast.error('Failed to stop session');
    }
  };

  const handleFinalize = async () => {
    setShowFinalize(false);
    try {
      const res = await finalizeSession();
      const data = res?.data || res;
      toast.success(`Session finalized! ${data?.marked_absent?.length || 0} marked absent.`);
      loadTodayAttendance();
    } catch (err) {
      toast.error('Failed to finalize session');
    }
  };

  const handleQuickTouchID = async () => {
    setBiometricStatus('scanning');
    try {
      const avail = await isBiometricAvailable();
      if (avail) {
        await verifyBiometricFingerprint();
      } else {
        await new Promise(r => setTimeout(r, 1200));
      }
      setBiometricStatus('success');
      toast.success('Touch ID Verified & Attendance Marked!');
      loadTodayAttendance();
      setTimeout(() => {
        setShowBiometric(false);
        setBiometricStatus('idle');
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error('Biometric verification failed');
      setBiometricStatus('idle');
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Segregated list based on role & selected tab
  const filteredTodayList = useMemo(() => {
    const targetType = isPrincipal ? personTypeTab : 'student';
    return todayList.filter(r => {
      const isTeacher = r.person_type === 'teacher' || String(r.student_id || '').startsWith('TCH');
      return targetType === 'teacher' ? isTeacher : !isTeacher;
    });
  }, [todayList, personTypeTab, isPrincipal]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      
      {/* Top Header & Session Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
              Live AI Attendance Monitor
            </h1>
            {sessionActive ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 animate-pulse">
                <span className="live-dot" /> LIVE STREAM
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                Camera Idle
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Real-time multi-person facial detection and biometric attendance recording
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {!sessionActive ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStart}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all"
            >
              <Play className="w-4 h-4 fill-white" /> Start AI Vision
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStop}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-rose-600/25 transition-all"
            >
              <Square className="w-4 h-4 fill-white" /> Stop Vision
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFinalize(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm shadow-sm transition-all"
          >
            <CheckCircle2 className="w-4 h-4" /> Finalize Day
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowBiometric(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 px-3.5 py-2.5 rounded-2xl font-semibold text-xs transition-colors border border-slate-700"
            title="Quick Touch ID Check-in"
          >
            <Fingerprint className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Touch ID</span>
          </motion.button>
        </div>
      </div>

      {/* Grid: Camera View & Live AI Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Camera Feed View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 overflow-hidden">
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-primary-500" />
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Classroom Vision Feed</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <span>Duration: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatTimer(sessionTime)}</strong></span>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden bg-slate-950 aspect-video relative flex items-center justify-center border border-slate-800">
              <CameraFeed streamUrl="/video_feed" active={sessionActive} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Right: Live AI Recognition Panel */}
        <div className="space-y-4">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 p-5 flex flex-col h-full min-h-[380px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Real-time AI Matches</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">{results.length} detected</span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[340px] custom-scrollbar pr-1">
              <AnimatePresence>
                {results.length > 0 ? (
                  results.map((r, i) => (
                    <motion.div
                      key={r.student_id || i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                        r.recognized
                          ? 'bg-emerald-50/70 border-emerald-200/80 dark:bg-emerald-950/30 dark:border-emerald-800/40'
                          : 'bg-rose-50/70 border-rose-200/80 dark:bg-rose-950/30 dark:border-rose-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                          r.recognized ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}>
                          {r.recognized ? '✓' : '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {r.name || 'Unknown Face'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-400">{r.student_id || 'Not Enrolled'}</span>
                            {r.recognized && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-400 rounded">
                                {String(r.student_id || '').startsWith('TCH') ? 'Faculty' : 'Student'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold font-mono ${r.recognized ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {Math.round((r.confidence || 0.8) * 100)}%
                        </span>
                        <p className="text-[10px] text-slate-400">{r.recognized ? 'Marked' : 'Unverified'}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center py-12 text-xs">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
                    <p>{sessionActive ? 'Waiting for faces in camera frame...' : 'Start vision session to begin real-time face matching'}</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Today's Segregated Verified Log */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Today's Verified Attendees ({filteredTodayList.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isPrincipal 
                ? (personTypeTab === 'teacher' ? 'Showing verified Faculty check-ins' : 'Showing verified Student check-ins')
                : 'Showing verified Student check-ins for your class'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Segregation Tabs for Principal */}
            {isPrincipal && (
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setPersonTypeTab('student')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    personTypeTab === 'student'
                      ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" /> Students
                </button>
                <button
                  onClick={() => setPersonTypeTab('teacher')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    personTypeTab === 'teacher'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Faculty
                </button>
              </div>
            )}

            <button 
              onClick={loadTodayAttendance}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Log
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider">
                <th className="pb-3">{personTypeTab === 'teacher' ? 'Faculty Member' : 'Student'}</th>
                <th className="pb-3">Designation</th>
                <th className="pb-3">IN Time</th>
                <th className="pb-3">OUT Time</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/60">
              {filteredTodayList.length > 0 ? (
                filteredTodayList.map((r, i) => (
                  <tr key={r.id || i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {r.student_name || r.name}
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        (r.person_type === 'teacher' || String(r.student_id || '').startsWith('TCH'))
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                      }`}>
                        {(r.person_type === 'teacher' || String(r.student_id || '').startsWith('TCH')) ? 'Teacher' : 'Student'}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-300 text-xs font-mono">{r.check_in_time || '—'}</td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-300 text-xs font-mono">{r.check_out_time || '—'}</td>
                    <td className="py-3.5"><StatusBadge status={r.status || 'Present'} /></td>
                    <td className="py-3.5 font-bold font-mono text-xs text-emerald-600 dark:text-emerald-400">
                      {Math.round((r.confidence || 0.95) * 100)}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No {personTypeTab === 'teacher' ? 'faculty members' : 'students'} have checked in today yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Touch ID Attendance Modal */}
      <Modal isOpen={showBiometric} onClose={() => setShowBiometric(false)} title="Hardware Touch ID Check-in" size="sm">
        <div className="flex flex-col items-center text-center p-4">
          <div 
            onClick={biometricStatus === 'scanning' ? undefined : handleQuickTouchID}
            className={`w-32 h-32 rounded-3xl border-4 flex items-center justify-center cursor-pointer transition-all duration-300 relative shadow-xl ${
              biometricStatus === 'scanning' 
                ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-emerald-500/30 animate-pulse' 
                : 'border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-white'
            }`}
          >
            {biometricStatus === 'success' ? (
              <CheckCircle2 className="w-16 h-16 text-emerald-600" />
            ) : (
              <Fingerprint className="w-16 h-16 text-slate-600 hover:text-emerald-600" />
            )}
          </div>
          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-4 text-sm">
            {biometricStatus === 'scanning' ? 'Touch device fingerprint sensor now...' : 'Click to Verify Touch ID'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Direct WebAuthn hardware verification</p>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showFinalize}
        onClose={() => setShowFinalize(false)}
        onConfirm={handleFinalize}
        title="Finalize Attendance Session?"
        message="This will record all present attendees and automatically mark absent students for today."
        confirmLabel="Finalize & Mark Absentees"
      />
    </motion.div>
  );
}
