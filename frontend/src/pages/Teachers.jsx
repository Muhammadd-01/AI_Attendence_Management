import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Search, Trash2, Mail, Lock, Eye, EyeOff, 
  Copy, CheckCircle2, Shield, UserCheck, AlertCircle, RefreshCw,
  Key, Sparkles, Filter, MoreVertical, Loader2, Camera, Fingerprint, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FaceCapture from '../components/FaceCapture';
import BiometricModal from '../components/BiometricModal';
import { useDebounce } from '../hooks/useDebounce';
import { getStoredClasses, saveNewClass, getStoredDepartments, saveNewDepartment } from '../utils/academicData';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);
  const [showCapture, setShowCapture] = useState(null);
  const [showBiometric, setShowBiometric] = useState(null);
  
  // Dynamic Academic Options
  const [classList, setClassList] = useState(getStoredClasses());
  const [deptList, setDeptList] = useState(getStoredDepartments());
  const [showNewClassInput, setShowNewClassInput] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [showNewDeptInput, setShowNewDeptInput] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  // Form State
  const [teacherId, setTeacherId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [assignedClass, setAssignedClass] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/teachers');
      const json = await res.json();
      if (json.success || json.status === 'success') {
        setTeachers(json.data || []);
      } else {
        toast.error(json.message || 'Failed to fetch teachers');
      }
    } catch (err) {
      toast.error('Network error while connecting to Firebase');
    } finally {
      setLoading(false);
    }
  };

  const getNextTeacherId = (list) => {
    let maxNum = 0;
    list.forEach(t => {
      const idStr = t.teacher_id || t.id || '';
      const match = idStr.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `TCH${String(maxNum + 1).padStart(3, '0')}`;
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    return pwd;
  };

  const handleOpenAdd = () => {
    const nextId = getNextTeacherId(teachers);
    setTeacherId(nextId);
    setName('');
    setEmail('');
    const currentDepts = getStoredDepartments();
    const currentClasses = getStoredClasses();
    setDeptList(currentDepts);
    setClassList(currentClasses);
    setDepartment(currentDepts[0] || 'Computer Science');
    setAssignedClass(currentClasses[0] || 'CS-401');
    setPassword(generateRandomPassword());
    setShowPassword(false);
    setShowNewClassInput(false);
    setShowNewDeptInput(false);
    setShowAddModal(true);
  };

  const handleAddNewClass = () => {
    if (!newClassName.trim()) return;
    const updated = saveNewClass(newClassName);
    setClassList(updated);
    setAssignedClass(newClassName.trim());
    setNewClassName('');
    setShowNewClassInput(false);
    toast.success(`Class "${newClassName.trim()}" added!`);
  };

  const handleAddNewDept = () => {
    if (!newDeptName.trim()) return;
    const updated = saveNewDepartment(newDeptName);
    setDeptList(updated);
    setDepartment(newDeptName.trim());
    setNewDeptName('');
    setShowNewDeptInput(false);
    toast.success(`Department "${newDeptName.trim()}" added!`);
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error('Please fill in all required fields');
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          name,
          email,
          department,
          assigned_class: assignedClass,
          password: password,
          status: 'active'
        })
      });
      const json = await res.json();
      if (json.success || json.status === 'success') {
        setTeachers(prev => [json.data, ...prev]);
        setShowAddModal(false);
        toast.success(`Faculty account created for ${name} (${teacherId})!`);
      } else {
        toast.error(json.message || json.error || 'Failed to create teacher');
      }
    } catch (err) {
      toast.error('Failed to create teacher account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!showDeleteDialog) return;
    try {
      const res = await fetch(`/api/teachers/${showDeleteDialog.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success || json.status === 'success') {
        setTeachers(prev => prev.filter(t => t.id !== showDeleteDialog.id));
        toast.success('Teacher removed from system');
      } else {
        toast.error(json.message || 'Failed to delete teacher');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setShowDeleteDialog(null);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        return (t.name || '').toLowerCase().includes(q) || 
               (t.email || '').toLowerCase().includes(q) ||
               (t.teacher_id || '').toLowerCase().includes(q) ||
               (t.department || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [teachers, statusFilter, debouncedSearch]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Faculty & Teachers</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage teacher accounts, passwords, biometric access, and assigned classes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTeachers}
            className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-emerald-600/20 transition-all text-sm"
          >
            <UserPlus className="w-4 h-4" /> Add Teacher
          </motion.button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Faculty</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{teachers.length}</p>
          </div>
          <div className="w-12 h-12 bg-primary-50 dark:bg-primary-950/40 rounded-2xl flex items-center justify-center text-primary-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Teachers</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {teachers.filter(t => t.status !== 'inactive').length}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Auth & Biometrics</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">Touch ID + Facial</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/40 rounded-2xl flex items-center justify-center text-purple-600">
            <Key className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teacher by name, ID, email, department..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Teachers Cards Grid */}
      <div className="w-full">
        {loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
            <p className="text-sm">Connecting to Firestore...</p>
          </div>
        ) : (
          <motion.div 
            variants={container} 
            initial="hidden" 
            animate="show" 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredTeachers.map((t) => (
              <motion.div
                key={t.id}
                variants={item}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {t.avatar_url ? (
                      <img 
                        src={t.avatar_url} 
                        alt={t.name} 
                        className="w-12 h-12 rounded-2xl object-cover border border-emerald-500/50 shadow-sm" 
                      />
                    ) : (
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-bold text-lg border border-emerald-200 dark:border-emerald-800/40">
                        {(t.name || 'T').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">{t.name}</p>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{t.teacher_id || t.id}</p>
                      <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                        t.status === 'inactive' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'inactive' ? 'bg-slate-400' : 'bg-emerald-500'}`} />
                        {t.status === 'inactive' ? 'Inactive' : 'Active'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowCapture(t)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Capture Faces"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowBiometric(t)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        t.biometric_enrolled 
                          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' 
                          : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-700'
                      }`}
                      title={t.biometric_enrolled ? "Touch ID Biometric Enrolled" : "Enroll Touch ID / Fingerprint"}
                    >
                      <Fingerprint className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteDialog(t)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Remove Teacher"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{t.email}</span>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700/50 pt-3 mt-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Department</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{t.department || 'General'}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Class</span>
                      <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">{t.assigned_class || 'CS-401'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && filteredTeachers.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center py-16 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-600" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">No teachers found</p>
            <p className="text-xs text-slate-400 mt-1">Add faculty accounts using the button above.</p>
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Faculty / Teacher Account"
        size="lg"
      >
        <form onSubmit={handleCreateTeacher} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Teacher ID (Auto-Generated)
              </label>
              <input
                type="text"
                value={teacherId}
                readOnly
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-600 dark:text-slate-300 outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Professor Ali Khan"
                required
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@school.edu"
              required
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Department & Class Selectors with Inline "+ Add New" */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Department / Field
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewDeptInput(!showNewDeptInput)}
                  className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add New
                </button>
              </div>

              {showNewDeptInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={e => setNewDeptName(e.target.value)}
                    placeholder="New Field Name"
                    className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewDept}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                >
                  {deptList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Assigned Class
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewClassInput(!showNewClassInput)}
                  className="text-xs text-primary-600 font-semibold flex items-center gap-0.5 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add New
                </button>
              </div>

              {showNewClassInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    placeholder="New Class (e.g. CS-501)"
                    className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewClass}
                    className="px-3 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <select
                  value={assignedClass}
                  onChange={(e) => setAssignedClass(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                >
                  {classList.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Password Section (Manual Entry or Auto-Generate) */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 mt-4 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Teacher Account Password
              </span>
              <button
                type="button"
                onClick={() => setPassword(generateRandomPassword())}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 underline"
              >
                <Sparkles className="w-3 h-3" /> Auto-Generate
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password or use auto-generated"
                required
                className="w-full bg-slate-800 text-white font-mono text-sm border border-slate-700 rounded-xl pl-4 pr-20 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(password, 'Password')}
                  className="text-slate-400 hover:text-emerald-400 p-1"
                  title="Copy password"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              You can manually type a custom password or click Auto-Generate.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Saving to Database...' : 'Create Account'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!showDeleteDialog}
        onClose={() => setShowDeleteDialog(null)}
        onConfirm={handleDeleteTeacher}
        title="Remove Teacher Account?"
        message={`Are you sure you want to remove ${showDeleteDialog?.name}? They will lose access to the Attendance portal.`}
        confirmLabel="Remove Teacher"
        danger
      />

      {/* Face Capture Modal */}
      {showCapture && (
        <Modal 
          isOpen={!!showCapture} 
          onClose={() => setShowCapture(null)} 
          title={`Capture Faculty Biometrics — ${showCapture.name}`} 
          size="xl"
        >
          <FaceCapture 
            personId={showCapture.id} 
            personName={showCapture.name}
            bucket="student-faces"
            onComplete={async (bestImageUrl) => { 
              try {
                if (bestImageUrl) {
                  await fetch(`/api/teachers/${showCapture.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ avatar_url: bestImageUrl })
                  });
                }
                setTeachers(prev => prev.map(tc => tc.id === showCapture.id ? { ...tc, avatar_url: bestImageUrl || tc.avatar_url } : tc));
                toast.success('Faculty face model and card photo updated!');
              } catch (err) {
                console.error(err);
              }
              setShowCapture(null); 
            }}
            onClose={() => setShowCapture(null)} 
          />
        </Modal>
      )}

      {/* Biometric Touch ID Modal */}
      {showBiometric && (
        <BiometricModal
          isOpen={!!showBiometric}
          onClose={() => setShowBiometric(null)}
          person={showBiometric}
          role="teacher"
          onEnrolled={(credId) => {
            setTeachers(prev => prev.map(tc => tc.id === showBiometric.id ? { ...tc, biometric_enrolled: true, biometric_credential_id: credId } : tc));
            setShowBiometric(null);
          }}
        />
      )}
    </motion.div>
  );
}
