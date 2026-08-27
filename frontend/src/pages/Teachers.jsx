import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Search, Trash2, Mail, Lock, Eye, EyeOff, 
  Copy, CheckCircle2, Shield, UserCheck, AlertCircle, RefreshCw,
  Key, Sparkles, Filter, MoreVertical, Loader2, Camera, Fingerprint, Plus,
  DollarSign, Calendar, TrendingDown, Edit3, Clock, Save, Banknote, Coins
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCapture, setShowCapture] = useState(null);
  const [showBiometric, setShowBiometric] = useState(null);
  
  // Payroll & Salary State
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollData, setPayrollData] = useState([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [editingSalaryId, setEditingSalaryId] = useState(null);
  const [editSalaryValue, setEditSalaryValue] = useState('');
  const [selectedTeacherDetail, setSelectedTeacherDetail] = useState(null);
  
  // Dynamic Academic Options
  const [classList, setClassList] = useState(getStoredClasses());
  const [deptList, setDeptList] = useState(getStoredDepartments());
  const [showNewClassInput, setShowNewClassInput] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [showNewDeptInput, setShowNewDeptInput] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  // Edit Teacher State
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editAssignedClass, setEditAssignedClass] = useState('');
  const [editSalary, setEditSalary] = useState('85000');
  const [editStatus, setEditStatus] = useState('active');
  const [editPassword, setEditPassword] = useState('');
  const [editShowPassword, setEditShowPassword] = useState(false);

  // Form State
  const [teacherId, setTeacherId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [assignedClass, setAssignedClass] = useState('');
  const [salary, setSalary] = useState('85000');
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

  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const handleOpenPayroll = () => {
    fetchPayroll();
    setShowPayrollModal(true);
  };

  const fetchPayroll = async () => {
    setPayrollLoading(true);
    try {
      const res = await fetch('/api/teachers/payroll');
      const json = await res.json();
      if (json.success || json.status === 'success') {
        setPayrollData(json.data || []);
      }
    } catch (err) {
      toast.error('Failed to load payroll calculations');
    } finally {
      setPayrollLoading(false);
    }
  };

  const handleUpdateSalary = async (tId, newSalary) => {
    const parsed = parseFloat(newSalary);
    if (isNaN(parsed) || parsed < 0) return toast.error('Please enter a valid salary');
    try {
      const res = await fetch(`/api/teachers/${tId}/salary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salary: parsed })
      });
      const json = await res.json();
      if (json.success || json.status === 'success') {
        toast.success('Salary updated successfully!');
        setEditingSalaryId(null);
        fetchPayroll();
        fetchTeachers();
      } else {
        toast.error(json.message || 'Failed to update salary');
      }
    } catch (err) {
      toast.error('Network error updating salary');
    }
  };

  const handleOpenEdit = (t) => {
    setEditingTeacher(t);
    setEditName(t.name || '');
    setEditEmail(t.email || '');
    setEditDepartment(t.department || deptList[0] || 'Computer Science');
    setEditAssignedClass(t.assigned_class || classList[0] || 'CS-401');
    setEditSalary(String(t.salary || 85000));
    setEditStatus(t.status || 'active');
    setEditPassword('');
    setEditShowPassword(false);
  };

  const handleSaveTeacherEdit = async (e) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setSubmitting(true);
    try {
      const payload = {
        name: editName,
        email: editEmail,
        department: editDepartment,
        assigned_class: editAssignedClass,
        salary: parseFloat(editSalary) || 3500,
        status: editStatus
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }
      const res = await fetch(`/api/teachers/${editingTeacher.teacher_id || editingTeacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success || json.status === 'success') {
        toast.success(`Updated details & salary for ${editName}!`);
        setTeachers(prev => prev.map(tc => (tc.id === editingTeacher.id || tc.teacher_id === editingTeacher.teacher_id) ? { ...tc, ...payload } : tc));
        setEditingTeacher(null);
      } else {
        toast.error(json.message || 'Failed to update teacher');
      }
    } catch (err) {
      toast.error('Network error updating teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error('Please fill in all required fields');
    
    setSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 650));
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          name,
          email,
          department,
          assigned_class: assignedClass,
          salary: parseFloat(salary) || 3500.0,
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

  const handleToggleStatus = async (teacher) => {
    setStatusUpdatingId(teacher.id);
    const newStatus = teacher.status === 'inactive' ? 'active' : 'inactive';
    try {
      await new Promise(r => setTimeout(r, 600));
      await fetch(`/api/teachers/${teacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setTeachers(prev => prev.map(t => t.id === teacher.id ? { ...t, status: newStatus } : t));
      toast.success(`${teacher.name} marked as ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!showDeleteDialog) return;
    setIsDeleting(true);
    try {
      await new Promise(r => setTimeout(r, 650));
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
      setIsDeleting(false);
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
            onClick={handleOpenPayroll}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md shadow-amber-600/20 transition-all text-sm"
          >
            <DollarSign className="w-4 h-4" /> Salary & Payroll
          </motion.button>

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
                      <motion.img 
                        initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        src={t.avatar_url} 
                        alt={t.name} 
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400 dark:border-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.4)] dark:shadow-[0_0_15px_rgba(16,185,129,0.5)] relative z-10" 
                      />
                    ) : (
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-bold text-lg border border-emerald-200 dark:border-emerald-800/40">
                        {(t.name || 'T').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">{t.name}</p>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{t.teacher_id || t.id}</p>
                      <button
                        onClick={() => handleToggleStatus(t)}
                        disabled={statusUpdatingId === t.id}
                        className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all hover:scale-105 ${
                          t.status === 'inactive' ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/50'
                        }`}
                        title="Click to toggle Active / Inactive status"
                      >
                        {statusUpdatingId === t.id ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'inactive' ? 'bg-slate-400' : 'bg-emerald-500'}`} />
                        )}
                        {statusUpdatingId === t.id ? 'Updating...' : t.status === 'inactive' ? 'Inactive' : 'Active'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Edit Teacher Details & Salary"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowCapture(t)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        t.is_trained || (t.encodings_count > 0)
                          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700'
                      }`}
                      title={t.is_trained ? "Face AI Model Trained" : "Capture Faces for AI"}
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
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{t.email}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md text-[11px] shrink-0 border border-emerald-200 dark:border-emerald-800/50">
                      PKR {(t.salary || 85000).toLocaleString()}/mo
                    </span>
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

          {/* Base Salary Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Base Monthly Salary (PKR) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs font-mono">PKR</span>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="85000"
                min="0"
                step="500"
                required
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 font-mono font-bold"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Calculates daily rate (PKR {Math.round(parseFloat(salary || 0) / 26).toLocaleString()}/day). Half days (&lt; 8 hrs duty) automatically deduct 50% of the daily rate.
            </p>
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
        title="Remove Faculty Member"
        message={`Are you sure you want to remove ${showDeleteDialog?.name}? They will lose access to the Attendance portal.`}
        confirmLabel="Remove Faculty"
        danger={true}
        isLoading={isDeleting}
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
            personId={showCapture.teacher_id || showCapture.id} 
            personName={showCapture.name}
            bucket="teacher-faces"
            onComplete={async (bestImageUrl, count) => { 
              try {
                const targetId = showCapture.teacher_id || showCapture.id;
                if (bestImageUrl) {
                  await fetch(`/api/teachers/${targetId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ avatar_url: bestImageUrl, face_count: count })
                  });
                }
                setTeachers(prev => prev.map(tc => (tc.teacher_id === targetId || tc.id === targetId) ? { 
                  ...tc, 
                  avatar_url: bestImageUrl || tc.avatar_url, 
                  face_count: count,
                  encodings_count: count,
                  is_trained: true 
                } : tc));
                toast.success('Faculty face model trained and photo updated!');
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

      {/* Edit Teacher Details & Salary Modal */}
      {editingTeacher && (
        <Modal
          isOpen={!!editingTeacher}
          onClose={() => setEditingTeacher(null)}
          title={`Edit Faculty Details & Salary — ${editingTeacher.name}`}
          size="lg"
        >
          <form onSubmit={handleSaveTeacherEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Faculty Member Name *
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Department / Field
                </label>
                <select
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                >
                  {deptList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Assigned Class
                </label>
                <select
                  value={editAssignedClass}
                  onChange={(e) => setEditAssignedClass(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                >
                  {classList.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Base Salary Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Base Monthly Salary (PKR) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs font-mono">PKR</span>
                <input
                  type="number"
                  value={editSalary}
                  onChange={(e) => setEditSalary(e.target.value)}
                  min="0"
                  step="500"
                  placeholder="85000"
                  required
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 font-mono font-bold"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Calculates daily rate (PKR {Math.round(parseFloat(editSalary || 0) / 26).toLocaleString()}/day). Half days (&lt; 8 hrs duty) automatically deduct 50% of the daily rate.
              </p>
            </div>

            {/* Account Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Account Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold"
              >
                <option value="active">Active (Access Allowed)</option>
                <option value="inactive">Inactive (Suspended)</option>
              </select>
            </div>

            {/* Optional Password Reset / Regenerate */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Reset Password (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newPwd = generateRandomPassword();
                    setEditPassword(newPwd);
                    setEditShowPassword(true);
                    toast.success('Generated new secure password!');
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Regenerate Password
                </button>
              </div>

              <div className="relative">
                <input
                  type={editShowPassword ? 'text' : 'password'}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep existing password"
                  className="w-full bg-slate-800 text-white font-mono text-sm border border-slate-700 rounded-xl pl-4 pr-20 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {editPassword && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(editPassword);
                        toast.success('Password copied to clipboard');
                      }}
                      className="text-slate-400 hover:text-white p-1"
                      title="Copy Password"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditShowPassword(!editShowPassword)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    {editShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {editPassword && (
                <p className="text-[11px] text-emerald-400 font-mono">
                  New Password set: <span className="font-bold underline">{editPassword}</span>
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Principal Salary & Automated Payroll Modal */}
      <Modal
        isOpen={showPayrollModal}
        onClose={() => { setShowPayrollModal(false); setSelectedTeacherDetail(null); }}
        title="Faculty Salary & Automated Payroll Engine"
        size="2xl"
      >
        <div className="space-y-5">
          {/* Header Description & Summary KPIs */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-white">8-Hour Duty Rule Payroll Calculation</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Calculates salary based on full days (8+ hrs) & automatically deducts 50% daily rate for half days (&lt; 8 hrs).
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={fetchPayroll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${payrollLoading ? 'animate-spin' : ''}`} />
              Recalculate
            </button>
          </div>

          {/* Payroll Table */}
          {payrollLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
              <p className="text-xs font-medium">Computing attendance records & duty hours...</p>
            </div>
          ) : payrollData.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No faculty payroll records available.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-3">Base Salary (PKR)</th>
                    <th className="py-3 px-3">Daily Rate</th>
                    <th className="py-3 px-3">Duty Summary</th>
                    <th className="py-3 px-3">Half-Day Deductions</th>
                    <th className="py-3 px-3 font-bold text-slate-800 dark:text-white">Net Payable (PKR)</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {payrollData.map((item) => (
                    <tr key={item.teacher_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                        <p className="font-mono text-[10px] text-slate-400">{item.teacher_id} • {item.department}</p>
                      </td>

                      {/* Base Salary with Inline Edit */}
                      <td className="py-3 px-3">
                        {editingSalaryId === item.teacher_id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-bold text-[10px]">PKR</span>
                            <input
                              type="number"
                              defaultValue={item.base_salary}
                              onChange={(e) => setEditSalaryValue(e.target.value)}
                              className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-emerald-500 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
                            />
                            <button
                              onClick={() => handleUpdateSalary(item.teacher_id, editSalaryValue || item.base_salary)}
                              className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingSalaryId(item.teacher_id); setEditSalaryValue(String(item.base_salary)); }}
                            className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white hover:text-emerald-500 transition-colors group"
                            title="Click to edit base salary"
                          >
                            <span>PKR {item.base_salary.toLocaleString()}</span>
                            <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-emerald-500" />
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-500">
                        PKR {Math.round(item.daily_rate).toLocaleString()}/day
                      </td>

                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                            {item.full_days} Full Days (8h+)
                          </span>
                          {item.half_days > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[10px] ml-1">
                              {item.half_days} Half Days
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {item.half_day_deductions > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-mono font-bold text-[11px]">
                            <TrendingDown className="w-3 h-3" /> -PKR {Math.round(item.half_day_deductions).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">PKR 0</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                        PKR {Math.round(item.net_salary).toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedTeacherDetail(selectedTeacherDetail?.teacher_id === item.teacher_id ? null : item)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold transition-colors"
                        >
                          {selectedTeacherDetail?.teacher_id === item.teacher_id ? 'Hide Log' : 'Logs'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Selected Teacher Detailed Early Checkout Breakdown */}
          {selectedTeacherDetail && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Early Checkouts & Half Days for {selectedTeacherDetail.name} ({selectedTeacherDetail.teacher_id})
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Month: {selectedTeacherDetail.month}</span>
              </div>

              {selectedTeacherDetail.early_checkouts?.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">
                  ✅ Excellent! This faculty member completed full 8-hour duty on all attended days with zero early checkouts.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedTeacherDetail.early_checkouts.map((rec, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{rec.date}</p>
                        <p className="text-slate-400 text-[10px] font-mono">
                          IN: {rec.check_in} • OUT: {rec.check_out} ({rec.duration_hours} hrs)
                        </p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                          Half Day
                        </span>
                        <p className="text-rose-500 text-[10px] font-bold mt-0.5">-PKR {Math.round(rec.deduction_amount).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </Modal>
    </motion.div>
  );
}
