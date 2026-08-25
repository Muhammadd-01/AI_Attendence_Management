import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCcw, Shield, Camera, Clock, Bell, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function Settings() {
  const [settings, setSettings] = useState({
    face_match_threshold: 0.55,
    recognition_cooldown: 30,
    late_threshold_minutes: 15,
    camera_index: 0,
    frame_process_interval: 5,
    classroom_name: 'Classroom A',
    enable_notifications: true
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(s => ({
      ...s,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Settings saved successfully');
    }, 800);
  };

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="max-w-4xl space-y-6">
      <motion.div variants={item}>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-500 mt-1">Configure system parameters and AI thresholds</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI & Recognition */}
        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex items-center gap-2 text-primary-700 font-semibold mb-2">
            <Shield className="w-5 h-5" /> AI & Recognition
          </div>
          <div>
            <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
              <span>Face Match Threshold</span>
              <span className="text-gray-500">{settings.face_match_threshold}</span>
            </label>
            <input type="range" name="face_match_threshold" min="0.3" max="0.8" step="0.01" value={settings.face_match_threshold} onChange={handleChange} className="w-full accent-primary-600" />
            <p className="text-xs text-gray-400 mt-1">Lower is stricter (more secure, less false positives).</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recognition Cooldown (seconds)</label>
            <input type="number" name="recognition_cooldown" value={settings.recognition_cooldown} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            <p className="text-xs text-gray-400 mt-1">Time before re-registering the same student.</p>
          </div>
        </motion.div>

        {/* Camera & Processing */}
        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex items-center gap-2 text-primary-700 font-semibold mb-2">
            <Camera className="w-5 h-5" /> Camera & Processing
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Camera Device Index</label>
            <input type="number" name="camera_index" value={settings.camera_index} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frame Process Interval</label>
            <input type="number" name="frame_process_interval" value={settings.frame_process_interval} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            <p className="text-xs text-gray-400 mt-1">Process every Nth frame. Higher = better performance, lower accuracy.</p>
          </div>
        </motion.div>

        {/* General */}
        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex items-center gap-2 text-primary-700 font-semibold mb-2">
            <Clock className="w-5 h-5" /> General Configuration
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Classroom Name</label>
            <input type="text" name="classroom_name" value={settings.classroom_name} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Late Threshold (minutes)</label>
            <input type="number" name="late_threshold_minutes" value={settings.late_threshold_minutes} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            <p className="text-xs text-gray-400 mt-1">Minutes after start before a student is marked 'Late'.</p>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 space-y-5">
          <div className="flex items-center gap-2 text-red-600 font-semibold mb-2">
            <Trash2 className="w-5 h-5" /> Danger Zone
          </div>
          <p className="text-sm text-gray-600">These actions are permanent and cannot be undone.</p>
          <button onClick={() => toast.error('This is a demo. Cannot purge database.')} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
            <Trash2 className="w-4 h-4" /> Purge Attendance History
          </button>
          <button onClick={() => toast.error('This is a demo. Cannot reset models.')} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
            <RefreshCcw className="w-4 h-4" /> Reset AI Encodings
          </button>
        </motion.div>
      </div>

      <motion.div variants={item} className="flex justify-end gap-4 pt-4 border-t border-gray-200">
        <button onClick={() => toast('Settings reset', { icon: '🔄' })} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
          Reset to Defaults
        </button>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-medium shadow-sm hover:bg-primary-700 focus:ring-4 focus:ring-primary-100 transition-all disabled:opacity-70">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </motion.div>
    </motion.div>
  );
}
