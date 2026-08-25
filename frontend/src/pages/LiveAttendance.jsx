import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Play, Square, CheckCircle2, AlertTriangle, Clock, Users, Zap, Shield, StopCircle, Fingerprint } from 'lucide-react';
import CameraFeed from '../components/CameraFeed';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';

// ── Mock Data ──────────────────────────────────────────────────
const MOCK_RECOGNITION = [
  { student_id: 'ST001', name: 'Muhammad Affan', confidence: 0.96, recognized: true, status: 'Checked In' },
  { student_id: null, name: 'Unknown', confidence: 0.21, recognized: false, status: 'Unknown' },
  { student_id: 'ST002', name: 'Ali Hassan', confidence: 0.94, recognized: true, status: 'Checked In' },
];

const MOCK_TODAY = [
  { student_id: 'ST001', name: 'Muhammad Affan', check_in: '08:12 AM', check_out: null, duration: null, status: 'Present', confidence: 0.96 },
  { student_id: 'ST002', name: 'Ali Hassan', check_in: '08:15 AM', check_out: '09:45 AM', duration: '1h 30m', status: 'Present', confidence: 0.94 },
  { student_id: 'ST003', name: 'Ahmed Khan', check_in: '08:22 AM', check_out: null, duration: null, status: 'Late', confidence: 0.91 },
  { student_id: 'ST004', name: 'Sara Ahmed', check_in: '08:05 AM', check_out: '09:50 AM', duration: '1h 45m', status: 'Present', confidence: 0.97 },
  { student_id: 'ST005', name: 'Fatima Zahra', check_in: '08:18 AM', check_out: null, duration: null, status: 'Present', confidence: 0.93 },
  { student_id: 'ST006', name: 'Usman Ali', check_in: '08:30 AM', check_out: null, duration: null, status: 'Late', confidence: 0.89 },
];
// ────────────────────────────────────────────────────────────────

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function LiveAttendance() {
  const { sessionActive, setSessionActive } = useApp();
  const [results, setResults] = useState([]);
  const [todayList, setTodayList] = useState(MOCK_TODAY);
  const [showFinalize, setShowFinalize] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  // Timer for session duration
  useEffect(() => {
    if (!sessionActive) return;
    const t = setInterval(() => setSessionTime(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [sessionActive]);

  // Simulate recognition polling
  useEffect(() => {
    if (!sessionActive) return;
    const t = setInterval(() => {
      setResults([...MOCK_RECOGNITION].sort(() => Math.random() - 0.5));
    }, 3000);
    return () => clearInterval(t);
  }, [sessionActive]);

  const handleStart = () => {
    setSessionActive(true);
    setSessionTime(0);
    setResults(MOCK_RECOGNITION);
    toast.success('Recognition session started');
  };

  const handleStop = () => {
    setSessionActive(false);
    setResults([]);
    toast('Session stopped', { icon: '⏹️' });
  };

  const handleFinalize = () => {
    setShowFinalize(false);
    toast.success('Session finalized — 2 students marked absent');
  };

  const formatTimer = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Live Attendance</h2>
          {sessionActive && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-semibold">
              <div className="live-dot" />
              LIVE
            </motion.div>
          )}
        </div>
        <div className="flex gap-3">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowBiometric(true)}
            className="hidden sm:flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow">
            <Fingerprint className="w-4 h-4" /> Biometric
          </motion.button>
          {!sessionActive ? (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleStart}
              className="flex items-center gap-2 bg-success text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow">
              <Play className="w-4 h-4" /> Start Session
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleStop}
              className="flex items-center gap-2 bg-danger text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow">
              <StopCircle className="w-4 h-4" /> Stop Session
            </motion.button>
          )}
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowFinalize(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow">
            <Shield className="w-4 h-4" /> Finalize
          </motion.button>
        </div>
      </div>

      {/* Session Info Bar */}
      {sessionActive && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-4 text-white flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 opacity-70" /><span className="font-mono text-lg">{formatTimer(sessionTime)}</span></div>
          <div className="flex items-center gap-2"><Users className="w-4 h-4 opacity-70" /><span>{todayList.length} detected</span></div>
          <div className="flex items-center gap-2"><Zap className="w-4 h-4 opacity-70" /><span>Processing @ 5 FPS</span></div>
        </motion.div>
      )}

      {/* Main split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Video className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-700">Camera Feed</span>
          </div>
          <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
            {sessionActive ? (
              <CameraFeed active={true} className="w-full h-full" />
            ) : (
              <div className="text-center text-gray-500">
                <Video className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">Camera Inactive</p>
                <p className="text-sm opacity-60 mt-1">Start a session to begin face recognition</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recognition Panel */}
        <motion.div variants={item} initial="hidden" animate="show" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700">Recognition Status</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence mode="popLayout">
              {results.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No active recognitions
                </div>
              ) : results.map((r, i) => (
                <motion.div key={`${r.student_id || 'unk'}-${i}`}
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`p-4 rounded-xl border ${r.recognized ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {r.recognized ? <CheckCircle2 className="w-5 h-5 text-success" /> : <AlertTriangle className="w-5 h-5 text-danger" />}
                      <span className="font-semibold text-gray-900">{r.name}</span>
                    </div>
                    <span className={`text-sm font-bold ${r.confidence >= 0.8 ? 'text-success' : r.confidence >= 0.5 ? 'text-warning' : 'text-danger'}`}>
                      {(r.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  {r.recognized && (
                    <p className="text-xs text-green-600 mt-1.5 ml-7">✓ {r.status}</p>
                  )}
                  {!r.recognized && (
                    <p className="text-xs text-red-500 mt-1.5 ml-7">⚠ Not in database</p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Today's Attendance Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Attendance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Student</th>
                <th className="pb-3 font-medium">Check In</th>
                <th className="pb-3 font-medium">Check Out</th>
                <th className="pb-3 font-medium">Duration</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {todayList.map((r, i) => (
                <motion.tr key={r.student_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.05 }}
                  className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3">
                    <p className="font-medium text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.student_id}</p>
                  </td>
                  <td className="py-3 text-gray-600">{r.check_in}</td>
                  <td className="py-3 text-gray-600">{r.check_out || <span className="text-gray-300">—</span>}</td>
                  <td className="py-3 text-gray-600">{r.duration || <span className="text-gray-300">—</span>}</td>
                  <td className="py-3"><StatusBadge status={r.status} /></td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${r.confidence >= 0.9 ? 'bg-success' : 'bg-warning'}`} style={{ width: `${r.confidence * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-500">{(r.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <ConfirmDialog isOpen={showFinalize} onClose={() => setShowFinalize(false)} onConfirm={handleFinalize}
        title="Finalize Session?" message="This will mark all undetected students as Absent. This action cannot be undone." confirmLabel="Finalize" />

      {/* Biometric Scanner Modal */}
      <Modal isOpen={showBiometric} onClose={() => setShowBiometric(false)} title="Biometric Terminal" size="md">
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <p className="text-gray-500 text-sm text-center">Place finger on the scanner</p>
          <div className="w-32 h-32 rounded-full border-4 border-gray-100 flex items-center justify-center fingerprint-scanner shadow-inner relative group cursor-pointer"
               onClick={async () => {
                 try {
                   // Ensure we are in a secure context or localhost
                   if (window.isSecureContext && window.PublicKeyCredential) {
                     const challenge = new Uint8Array(32);
                     window.crypto.getRandomValues(challenge);
                     const userId = new Uint8Array(16);
                     window.crypto.getRandomValues(userId);

                     await navigator.credentials.create({
                       publicKey: {
                         challenge: challenge,
                         rp: { name: "AI Attendance", id: window.location.hostname },
                         user: { 
                           id: userId, 
                           name: "student@university.edu", 
                           displayName: "Student" 
                         },
                         pubKeyCredParams: [
                           { type: "public-key", alg: -7 }, // ES256 (Touch ID)
                           { type: "public-key", alg: -257 } // RS256
                         ],
                         authenticatorSelection: { 
                           authenticatorAttachment: "platform", 
                           userVerification: "required" 
                         },
                         timeout: 60000,
                         attestation: "none"
                       }
                     });
                     toast.success('Touch ID Verified: Muhammad Affan');
                   } else {
                     toast.success('Fingerprint Match: Muhammad Affan (Mocked)');
                   }
                   setTimeout(() => setShowBiometric(false), 800);
                 } catch (error) {
                   console.error("Biometric failed", error);
                   toast.error('Biometric authentication canceled or failed');
                   setTimeout(() => setShowBiometric(false), 800);
                 }
               }}>
            <Fingerprint className="w-16 h-16 text-primary-500 opacity-20 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="flex items-center gap-2 text-sm text-success font-medium">
            <Shield className="w-4 h-4" /> SecurID Enabled
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
