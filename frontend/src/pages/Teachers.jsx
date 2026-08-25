import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Search, Trash2, Mail, Lock, Eye, EyeOff, 
  Copy, CheckCircle2, Shield, UserCheck, AlertCircle, RefreshCw,
  Key, Sparkles, Filter, MoreVertical, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDebounce } from '../hooks/useDebounce';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [assignedClass, setAssignedClass] = useState('CS-401');
  const [generatedPassword, setGeneratedPassword] = useState('');
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

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    return pwd;
  };

  const handleOpenAdd = () => {
    setName('');
    setEmail('');
    setDepartment('Computer Science');
    setAssignedClass('CS-401');
    const pwd = generatePassword();
    setGeneratedPassword(pwd);
    setShowPassword(false);
    setShowAddModal(true);
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    if (!name || !email) return toast.error('Please enter name and email');
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          department,
          assigned_class: assignedClass,
          password: generatedPassword,
          status: 'active'
        })
      });
      const json = await res.json();
      if (json.success || json.status === 'success') {
        setTeachers(prev => [json.data, ...prev]);
        toast.success(`Teacher account created for ${name}!`);
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Faculty & Teachers</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Godfather Control
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Manage teacher accounts, issue credentials, and configure classroom permissions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTeachers}
            className="p-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" /> Add Teacher
          </motion.button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Faculty</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{teachers.length}</p>
          </div>
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Teachers</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {teachers.filter(t => t.status !== 'inactive').length}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Auth Method</p>
            <p className="text-lg font-bold text-purple-600 mt-1">Firebase + Biometrics</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
            <Key className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teacher by name, email, department..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
            <p className="text-sm">Connecting to Firebase Firestore...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50/70 border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Teacher</th>
                  <th className="px-6 py-4 font-medium">Email Address</th>
                  <th className="px-6 py-4 font-medium">Department</th>
                  <th className="px-6 py-4 font-medium">Assigned Class</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <motion.tbody variants={container} initial="hidden" animate="show" className="divide-y divide-gray-50">
                {filteredTeachers.map((t) => (
                  <motion.tr key={t.id} variants={item} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold text-sm">
                          {(t.name || 'T').split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-400">ID: {t.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                      {t.email}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {t.department || 'Computer Science'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                        {t.assigned_class || 'CS-401'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        t.status === 'inactive' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'inactive' ? 'bg-gray-400' : 'bg-emerald-500'}`} />
                        {t.status === 'inactive' ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setShowDeleteDialog(t)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete teacher"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}

        {!loading && filteredTeachers.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-600" />
            <p className="font-semibold text-gray-700">No teachers found in database</p>
            <p className="text-sm mt-1 text-gray-400">Click &ldquo;Add Teacher&rdquo; to register your first faculty member</p>
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Teacher Account" size="lg">
        <form onSubmit={handleCreateTeacher} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Professor Ali Khan"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.edu"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option>Computer Science</option>
                <option>Artificial Intelligence</option>
                <option>Data Science & Analytics</option>
                <option>Software Engineering</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Assigned Classroom
              </label>
              <select
                value={assignedClass}
                onChange={(e) => setAssignedClass(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="CS-401">CS-401 (AI Lab)</option>
                <option value="CS-402">CS-402 (Data Science Lab)</option>
                <option value="CS-403">CS-403 (Robotics Wing)</option>
              </select>
            </div>
          </div>

          {/* Generated Password Box */}
          <div className="bg-slate-900 text-white rounded-xl p-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Auto-Generated Password
              </span>
              <button
                type="button"
                onClick={() => setGeneratedPassword(generatePassword())}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Regenerate
              </button>
            </div>
            <div className="flex items-center justify-between bg-slate-800 rounded-lg p-3">
              <span className="font-mono text-sm tracking-wider">
                {showPassword ? generatedPassword : '••••••••••••'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedPassword, 'Password')}
                  className="text-slate-400 hover:text-emerald-400 p-1"
                  title="Copy password"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              This credential will be saved in Firebase and can be shared directly with the teacher.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
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
              {submitting ? 'Saving to Firebase...' : 'Create Account'}
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
    </motion.div>
  );
}
