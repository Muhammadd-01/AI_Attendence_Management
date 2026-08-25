import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, Camera, Edit, Trash2, Eye, Filter, X, GraduationCap, ImagePlus, Loader2 } from 'lucide-react';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import FaceCapture from '../components/FaceCapture';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';

const EMPTY_FORM = { student_id: '', name: '', email: '', class_name: 'CS-401', course: 'Artificial Intelligence' };
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
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const filtered = useMemo(() => {
    return students.filter(s => {
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
  }, [students, statusFilter, classFilter, debouncedSearch]);

  const handleAdd = () => { setForm({ ...EMPTY_FORM }); setShowAdd(true); };
  
  const handleSaveNew = async () => {
    if (!form.name || !form.student_id) return toast.error('Name and ID are required');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        setStudents([...students, json.data]);
        setShowAdd(false);
        toast.success(`${form.name} registered`);
      } else {
        toast.error(json.error || 'Failed to create student');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (s) => { setForm(s); setShowEdit(true); };
  
  const handleSaveEdit = async () => {
    setIsSubmitting(true);
    try {
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

  const handleDelete = async () => {
    try {
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

  const FormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Student ID (Roll Number)</label>
        <input 
          value={form.student_id} 
          onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
          readOnly={!!showEdit} 
          className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition ${showEdit ? 'bg-gray-50 text-gray-500' : ''}`}
          placeholder="e.g. ST001" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition" placeholder="e.g. Muhammad Affan" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition" placeholder="student@example.com" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <select value={form.class_name} onChange={e => setForm(f => ({ ...f, class_name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition">
            <option value="CS-401">CS-401</option>
            <option value="CS-402">CS-402</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
          <select value={form.course} onChange={e => setForm(f => ({ ...f, course: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition">
            <option>Artificial Intelligence</option>
            <option>Data Science</option>
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
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleAdd}
          className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow">
          <UserPlus className="w-4 h-4" /> Add Student
        </motion.button>
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

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50/50">
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Class</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Face Dataset</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Attendance</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <motion.tbody variants={container} initial="hidden" animate="show" className="divide-y divide-gray-50">
              {filtered.map(s => (
                <motion.tr key={s.student_id} variants={row} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{s.student_id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                        {s.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium text-gray-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{s.class_name}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{s.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(s.face_count, 100)}%` }}
                          transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full ${s.face_count >= 100 ? 'bg-success' : s.face_count >= 50 ? 'bg-warning' : 'bg-danger'}`} />
                      </div>
                      <span className="text-xs text-gray-500">{s.face_count}/100</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${s.status === 'active' ? 'badge-present' : 'badge-absent'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${s.attendance_pct >= 80 ? 'text-success' : s.attendance_pct >= 60 ? 'text-warning' : 'text-danger'}`}>
                      {s.attendance_pct}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEditClick(s)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setShowCapture(s)} className="p-1.5 text-gray-400 hover:text-success hover:bg-green-50 rounded-lg transition-colors" title="Capture Faces">
                        <Camera className="w-4 h-4" />
                      </button>
                      <button onClick={() => setShowDelete(s)} className="p-1.5 text-gray-400 hover:text-danger hover:bg-red-50 rounded-lg transition-colors" title="Deactivate">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No students found</p>
            <p className="text-sm mt-1">Try adjusting your filters or add a new student</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Student" size="md">
        <FormFields />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveNew} className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
            Register Student
          </motion.button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Student" size="md">
        <FormFields />
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
          <FaceCapture studentId={showCapture.student_id} studentName={showCapture.name}
            onComplete={() => { setShowCapture(null); toast.success('Face capture complete!'); }}
            onClose={() => setShowCapture(null)} />
        </Modal>
      )}

      <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete}
        title="Deactivate Student?" message={`Are you sure you want to deactivate ${showDelete?.name}? They will no longer appear in attendance sessions.`}
        confirmLabel="Deactivate" danger />
    </motion.div>
  );
}
