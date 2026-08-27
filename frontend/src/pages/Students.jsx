import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, Camera, Edit, Trash2, Eye, Filter, X, GraduationCap, ImagePlus, Loader2, Fingerprint, Plus } from 'lucide-react';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import FaceCapture from '../components/FaceCapture';
import BiometricModal from '../components/BiometricModal';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';
import { getStoredClasses, saveNewClass, getStoredDepartments, saveNewDepartment } from '../utils/academicData';
import { useApp } from '../context/AppContext';

const EMPTY_FORM = { student_id: '', name: '', email: '', password: 'student123', class_name: 'CS-401', course: 'Artificial Intelligence' };
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const row = { hidden: { opacity: 0, x: -15 }, show: { opacity: 1, x: 0 } };

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showCapture, setShowCapture] = useState(null);
  const [showBiometric, setShowBiometric] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Academic Options
  const [classList, setClassList] = useState(getStoredClasses());
  const [deptList, setDeptList] = useState(getStoredDepartments());
  const [showNewClassInput, setShowNewClassInput] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [showNewDeptInput, setShowNewDeptInput] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students');
      const json = await res.json();
      if (json.success) setStudents(json.data);
    } catch (err) {
      toast.error('Failed to load students from database');
    } finally {
      setLoading(false);
    }
  };

  const getNextStudentId = (list) => {
    let maxNum = 0;
    list.forEach(s => {
      const idStr = s.student_id || s.id || '';
      const match = idStr.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `ST${String(maxNum + 1).padStart(3, '0')}`;
  };

  const { user } = useApp();
  const isPrincipal = user?.role === 'principal';

  const filtered = useMemo(() => {
    return students.filter(s => {
      if (!isPrincipal && user?.assignedClass && s.class_name !== user.assignedClass) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (classFilter !== 'all' && s.class_name !== classFilter) return false;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        return (s.name || '').toLowerCase().includes(q) || 
               (s.student_id || '').toLowerCase().includes(q) || 
               (s.email || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [students, statusFilter, classFilter, debouncedSearch, isPrincipal, user]);

  const handleAdd = () => {
    const nextId = getNextStudentId(students);
    const classes = getStoredClasses();
    const depts = getStoredDepartments();
    setClassList(isPrincipal ? classes : (user?.assignedClass ? [user.assignedClass] : []));
    setDeptList(isPrincipal ? depts : (user?.department ? [user.department] : []));
    setForm({
      student_id: nextId,
      name: '',
      email: '',
      password: 'student123',
      class_name: (!isPrincipal && user?.assignedClass) ? user.assignedClass : (classes[0] || 'CS-401'),
      course: (!isPrincipal && user?.department) ? user.department : (depts[0] || 'Artificial Intelligence')
    });
    setShowNewClassInput(false);
    setShowNewDeptInput(false);
    setShowAdd(true);
  };
  
  const handleAddNewClass = () => {
    if (!newClassName.trim()) return;
    const updated = saveNewClass(newClassName);
    setClassList(updated);
    setForm(f => ({ ...f, class_name: newClassName.trim() }));
    setNewClassName('');
    setShowNewClassInput(false);
    toast.success(`Class "${newClassName.trim()}" added!`);
  };

  const handleAddNewDept = () => {
    if (!newDeptName.trim()) return;
    const updated = saveNewDepartment(newDeptName);
    setDeptList(updated);
    setForm(f => ({ ...f, course: newDeptName.trim() }));
    setNewDeptName('');
    setShowNewDeptInput(false);
    toast.success(`Department/Course "${newDeptName.trim()}" added!`);
  };

  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const handleSaveNew = async () => {
    if (!form.name || !form.student_id) return toast.error('Name and ID are required');
    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 650));
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        setStudents([...students, json.data]);
        setShowAdd(false);
        toast.success(`${form.name} (${form.student_id}) registered`);
      } else {
        toast.error(json.error || 'Failed to create student');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (s) => { 
    setForm(s); 
    const classes = getStoredClasses();
    const depts = getStoredDepartments();
    setClassList(isPrincipal ? classes : (user?.assignedClass ? [user.assignedClass] : []));
    setDeptList(isPrincipal ? depts : (user?.department ? [user.department] : []));
    setShowEdit(true); 
  };
  
  const handleSaveEdit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      const res = await fetch(`/api/students/${form.student_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        setStudents(students.map(s => s.student_id === form.student_id ? json.data : s));
        setShowEdit(false);
        toast.success('Student updated');
      } else {
        toast.error(json.error || 'Update failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (student) => {
    setStatusUpdatingId(student.student_id);
    const newStatus = student.status === 'inactive' ? 'active' : 'inactive';
    try {
      await new Promise(r => setTimeout(r, 600));
      await fetch(`/api/students/${student.student_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setStudents(prev => prev.map(s => s.student_id === student.student_id ? { ...s, status: newStatus } : s));
      toast.success(`${student.name} marked as ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    try {
      await new Promise(r => setTimeout(r, 650));
      const res = await fetch(`/api/students/${showDelete.student_id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setStudents(students.filter(s => s.student_id !== showDelete.student_id));
        setShowDelete(null);
        toast.success('Student removed completely');
      } else {
        toast.error('Failed to delete student');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const renderFormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
          Student ID (Roll Number - Auto Generated)
        </label>
        <input 
          value={form.student_id} 
          onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
          readOnly={!!showEdit} 
          className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none ${showEdit ? 'cursor-not-allowed opacity-80' : ''}`}
          placeholder="e.g. ST001" 
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
          Full Name *
        </label>
        <input 
          value={form.name} 
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none" 
          placeholder="e.g. Muhammad Affan" 
          required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
          Email Address
        </label>
        <input 
          type="email" 
          value={form.email} 
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none" 
          placeholder="student@example.com" 
        />
      </div>
      {isPrincipal && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Student Portal Password
          </label>
          <input 
            type="text" 
            value={form.password || ''} 
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none" 
            placeholder="e.g. student123" 
          />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 block">
            Class
          </label>
          <select 
            value={form.class_name} 
            onChange={e => setForm(f => ({ ...f, class_name: e.target.value }))}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none appearance-none font-medium"
            disabled={!isPrincipal}
          >
            {classList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {!isPrincipal && <p className="text-[10px] text-slate-400 mt-1">Assigned to your class automatically</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 block">
            Department / Course
          </label>
          <select 
            value={form.course} 
            onChange={e => setForm(f => ({ ...f, course: e.target.value }))}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none appearance-none font-medium"
            disabled={!isPrincipal}
          >
            {deptList.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Students</h2>
          <p className="text-gray-500 mt-1">{filtered.length} students found</p>
        </div>
        {isPrincipal && (
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleAdd}
            className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow">
            <UserPlus className="w-4 h-4" /> Add Student
          </motion.button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, ID, or email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition">
          <option value="all">All Classes</option>
          <option value="CS-401">CS-401</option>
          <option value="CS-402">CS-402</option>
        </select>
      </div>

      {/* Students Cards Grid */}
      <div className="w-full">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
            <p className="text-sm">Loading students from database...</p>
          </div>
        ) : (
          <motion.div 
            variants={container} 
            initial="hidden" 
            animate="show" 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filtered.map(s => (
              <motion.div 
                key={s.student_id} 
                variants={row} 
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {s.avatar_url ? (
                      <motion.img 
                        initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        src={s.avatar_url} 
                        alt={s.name} 
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 dark:border-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.4)] dark:shadow-[0_0_15px_rgba(16,185,129,0.5)] relative z-10 shrink-0" 
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-bold text-xl border border-blue-200 dark:border-blue-800/40 shrink-0">
                        {(s.name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white leading-tight truncate max-w-[140px]">{s.name}</p>
                      <p className="text-[11px] font-mono text-slate-400">{s.student_id}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={() => handleToggleStatus(s)}
                      disabled={statusUpdatingId === s.student_id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all hover:scale-105 ${
                        s.status === 'inactive' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200' : 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 hover:bg-primary-100'
                      }`}
                      title="Click to toggle Active / Inactive status"
                    >
                      {statusUpdatingId === s.student_id ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      ) : (
                        <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'inactive' ? 'bg-slate-400' : 'bg-primary-500'}`} />
                      )}
                      {statusUpdatingId === s.student_id ? 'Updating...' : s.status || 'Active'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mt-auto">
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Class</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{s.class_name || 'CS-401'}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Attendance</span>
                      <span className={`text-sm font-bold ${s.attendance_pct >= 80 ? 'text-success' : s.attendance_pct >= 60 ? 'text-warning' : 'text-danger'}`}>
                        {s.attendance_pct || 0}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Face Dataset</span>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{s.face_count || 0}/20</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-full">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${Math.min(((s.face_count || 0) / 20) * 100, 100)}%` }}
                          transition={{ delay: 0.2, duration: 0.6 }}
                          className={`h-full rounded-full ${s.face_count >= 20 ? 'bg-success' : s.face_count >= 10 ? 'bg-warning' : 'bg-danger'}`} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => setShowCapture(s)} 
                      className={`flex-1 flex items-center justify-center gap-1 p-2 rounded-xl transition-colors text-xs font-semibold ${
                        s.is_trained || (s.encodings_count > 0)
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                      }`}
                      title={s.is_trained ? "Face AI Model Trained" : "Capture Face Dataset"}
                    >
                      <Camera className="w-3.5 h-3.5" /> Faces
                    </button>
                    <button 
                      onClick={() => setShowBiometric(s)} 
                      className={`flex-1 flex items-center justify-center gap-1 p-2 rounded-xl transition-colors text-xs font-semibold ${
                        s.biometric_enrolled 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100' 
                          : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100'
                      }`}
                      title="Hardware Touch ID / Fingerprint Biometric"
                    >
                      <Fingerprint className="w-3.5 h-3.5" /> {s.biometric_enrolled ? 'Touch ID ✓' : 'Fingerprint'}
                    </button>
                    <button 
                      onClick={() => handleEditClick(s)} 
                      className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-xl transition-colors" 
                      title="Edit Student"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {isPrincipal && (
                      <button 
                        onClick={() => setShowDelete(s)} 
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-xl transition-colors" 
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center py-16 text-slate-400">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary-600" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">No students found</p>
            <p className="text-sm mt-1">Try adjusting your filters or add a new student</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Student" size="md">
        {renderFormFields()}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveNew} className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
            Register Student
          </motion.button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Student" size="md">
        {renderFormFields()}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowEdit(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveEdit} className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
            Save Changes
          </motion.button>
        </div>
      </Modal>

      {/* Face Capture Modal */}
      {showCapture && (
        <Modal isOpen={!!showCapture} onClose={() => setShowCapture(null)} title={`Capture Faces — ${showCapture.name}`} size="xl">
          <FaceCapture 
            personId={showCapture.student_id} 
            personName={showCapture.name}
            bucket="student-faces"
            onComplete={async (bestImageUrl, count) => {
              try {
                if (bestImageUrl) {
                  await fetch(`/api/students/${showCapture.student_id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ avatar_url: bestImageUrl, face_count: count })
                  });
                }
                setStudents(prev => prev.map(st => st.student_id === showCapture.student_id ? { 
                  ...st, 
                  avatar_url: bestImageUrl || st.avatar_url, 
                  face_count: count,
                  encodings_count: count,
                  is_trained: true
                } : st));
                toast.success('Student face model and card photo updated!');
              } catch (err) {
                console.error(err);
              }
              setShowCapture(null);
            }}
            onClose={() => setShowCapture(null)} 
          />
        </Modal>
      )}

      {/* Biometric Fingerprint Modal */}
      {showBiometric && (
        <BiometricModal
          isOpen={!!showBiometric}
          onClose={() => setShowBiometric(null)}
          person={showBiometric}
          role="student"
          onEnrolled={(credId) => {
            setStudents(prev => prev.map(st => st.student_id === showBiometric.student_id ? { ...st, biometric_enrolled: true, biometric_credential_id: credId } : st));
            setShowBiometric(null);
          }}
        />
      )}

      <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete}
        title="Deactivate Student?" message={`Are you sure you want to deactivate ${showDelete?.name}? They will no longer appear in attendance sessions.`}
        confirmLabel="Deactivate" danger />
    </motion.div>
  );
}
