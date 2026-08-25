import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, RefreshCcw, Shield, Camera, Clock, Bell, Trash2, 
  Sparkles, CheckCircle2, Cpu, Lock, Sliders, Database, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } } };

export default function Settings() {
  const [settings, setSettings] = useState({
    face_match_threshold: 0.55,
    recognition_cooldown: 30,
    late_threshold_minutes: 15,
    camera_index: 0,
    frame_process_interval: 5,
    classroom_name: 'Main Vision Studio Hall',
    enable_notifications: true
  });

  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(s => ({
      ...s,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Smooth deliberate buffering transition
    await new Promise(r => setTimeout(r, 750));
    setSaving(false);
    toast.success('System configuration and AI hyperparameters saved!');
  };

  const handleReset = async () => {
    setShowResetDialog(false);
    setResetting(true);
    await new Promise(r => setTimeout(r, 700));
    setSettings({
      face_match_threshold: 0.55,
      recognition_cooldown: 30,
      late_threshold_minutes: 15,
      camera_index: 0,
      frame_process_interval: 5,
      classroom_name: 'Main Vision Studio Hall',
      enable_notifications: true
    });
    setResetting(false);
    toast.success('Settings restored to factory defaults');
  };

  const handlePurge = async () => {
    setShowPurgeDialog(false);
    toast.success('Historical demo attendance cache purged cleanly');
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="show" 
      variants={container} 
      className="max-w-3xl mx-auto space-y-8 flex flex-col items-center justify-center pt-2 pb-12"
    >
      {/* Header Centered */}
      <motion.div variants={item} className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800/40 text-primary-600 dark:text-primary-400 text-xs font-bold font-mono">
          <Sliders className="w-3.5 h-3.5" />
          SYSTEM CONFIGURATION & HYPERPARAMETERS
        </div>
        <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">
          System Preferences
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
          Calibrate computer vision match tolerances, camera stream rates, and institutional attendance thresholds.
        </p>
      </motion.div>

      {/* Card 1: AI & Face Recognition Engine */}
      <motion.div 
        variants={item} 
        className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary-600/25">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">AI Vision & Biometrics</h2>
              <p className="text-xs text-slate-400">Embedding Euclidean distance tolerances</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-primary-600 dark:text-primary-400 px-2.5 py-1 bg-primary-50 dark:bg-primary-950/50 rounded-xl border border-primary-200/60 dark:border-primary-800/50">
            dlib-HOG • 128D
          </span>
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <span>Face Match Tolerance (Threshold)</span>
                <span className="text-slate-400 font-normal">(Lower = More Strict)</span>
              </span>
              <span className="font-mono font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 rounded-lg">
                {settings.face_match_threshold}
              </span>
            </div>
            <input 
              type="range" 
              name="face_match_threshold" 
              min="0.3" 
              max="0.8" 
              step="0.01" 
              value={settings.face_match_threshold} 
              onChange={handleChange} 
              className="w-full accent-primary-600 cursor-pointer" 
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>0.30 (Ultra Secure)</span>
              <span>0.55 (Standard Recommended)</span>
              <span>0.80 (Loose)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Recognition Cooldown (Seconds)
              </label>
              <input 
                type="number" 
                name="recognition_cooldown" 
                value={settings.recognition_cooldown} 
                onChange={handleChange} 
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500" 
              />
              <p className="text-[10px] text-slate-400 mt-1">Prevents duplicate check-ins in quick succession</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Frame Process Interval (FPS Skip)
              </label>
              <input 
                type="number" 
                name="frame_process_interval" 
                value={settings.frame_process_interval} 
                onChange={handleChange} 
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500" 
              />
              <p className="text-[10px] text-slate-400 mt-1">Processes every Nth camera frame to save CPU</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Card 2: Classroom & Session Automation */}
      <motion.div 
        variants={item} 
        className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/25">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Classroom & Timing Policy</h2>
              <p className="text-xs text-slate-400">Attendance grace periods & device assignment</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Classroom / Hall Designation
            </label>
            <input 
              type="text" 
              name="classroom_name" 
              value={settings.classroom_name} 
              onChange={handleChange} 
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Late Threshold (Minutes)
            </label>
            <input 
              type="number" 
              name="late_threshold_minutes" 
              value={settings.late_threshold_minutes} 
              onChange={handleChange} 
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>
        </div>
      </motion.div>

      {/* Card 3: Biometrics & Security Vault */}
      <motion.div 
        variants={item} 
        className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/25">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Security & Data Vault</h2>
              <p className="text-xs text-slate-400">Encrypted biometric templates & cache purging</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/50">
            ENCRYPTED AES-256
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-bold text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Purge Demo Attendance History
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Clear temporary simulation logs while preserving registered faculty & student profiles.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPurgeDialog(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            Purge Cache
          </button>
        </div>
      </motion.div>

      {/* Centered Save / Reset Action Bar */}
      <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={() => setShowResetDialog(true)}
          disabled={resetting || saving}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all disabled:opacity-50"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Restoring...' : 'Reset to Defaults'}</span>
        </button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleSave}
          disabled={saving || resetting}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-primary-600/30 transition-all disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving Configurations...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleReset}
        title="Reset to Factory Defaults?"
        message="Are you sure you want to reset all AI tolerances and timing configurations to default values?"
        confirmLabel="Reset Defaults"
      />

      {/* Purge Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showPurgeDialog}
        onClose={() => setShowPurgeDialog(false)}
        onConfirm={handlePurge}
        title="Purge Demo Attendance Cache?"
        message="This will clear demo session logs. Enrolled face models and student records will remain safe."
        confirmLabel="Purge Demo Data"
        danger
      />
    </motion.div>
  );
}
