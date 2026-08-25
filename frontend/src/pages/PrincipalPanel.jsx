import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, ArrowLeft, Users, UserPlus, Trash2, Key, Copy, CheckCircle2, 
  Mail, Lock, Eye, EyeOff, Brain, GraduationCap, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function PrincipalPanel() {
  const navigate = useNavigate();
  const { user } = useApp();
  
  const [activeTab, setActiveTab] = useState('teachers'); // 'teachers' or 'students'
  
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState(''); // For teacher
  const [newStudentId, setNewStudentId] = useState(''); // For student
  const [newStudentClass, setNewStudentClass] = useState(''); // For student
  
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'teachers') {
        const res = await fetch('/api/teachers');
        const json = await res.json();
        if (json.success) setTeachers(json.data);
      } else {
        const res = await fetch('/api/students');
        const json = await res.json();
        if (json.success) setStudents(json.data);
      }
    } catch (err) {
      toast.error(`Failed to load ${activeTab}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
    let pwd = '';
    for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    return pwd;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (activeTab === 'teachers') {
        const pwd = generatePassword();
        const res = await fetch('/api/teachers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName, email: newEmail, password: pwd })
        });
        const json = await res.json();
        if (json.success) {
          setGeneratedPassword(pwd);
          setTeachers([...teachers, json.data]);
          toast.success('Teacher created successfully!');
        } else {
          toast.error('Failed to create teacher');
        }
      } else {
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName, student_id: newStudentId, class_name: newStudentClass })
        });
        const json = await res.json();
        if (json.success) {
          setStudents([...students, json.data]);
          setShowAdd(false);
          setNewName('');
          setNewStudentId('');
          setNewStudentClass('');
          toast.success('Student created successfully!');
        } else {
          toast.error('Failed to create student');
        }
      }
    } catch (err) {
      toast.error('An error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const endpoint = activeTab === 'teachers' ? `/api/teachers/${id}` : `/api/students/${id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      const json = await res.json();
      
      if (json.success) {
        if (activeTab === 'teachers') {
          setTeachers(teachers.filter(t => t.id !== id));
        } else {
          setStudents(students.filter(s => s.id !== id));
        }
        toast.success('Record deleted');
      } else {
        toast.error('Failed to delete');
      }
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/80 border-b border-slate-700 px-4 sm:px-8 py-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-slate-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Godfather Panel</h1>
                <p className="text-sm text-slate-400">System-wide Teacher & Student Management</p>
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Logged in as <span className="text-emerald-400 font-medium">{user?.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
        
        {/* Tabs */}
        <div className="flex space-x-2 bg-slate-800 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('teachers')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'teachers' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Users className="w-4 h-4" /> Manage Teachers
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'students' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <GraduationCap className="w-4 h-4" /> Manage Students
          </button>
        </div>

        {/* Add Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{activeTab === 'teachers' ? 'Teacher Accounts' : 'Student Database'}</h2>
          <button
            onClick={() => { setShowAdd(!showAdd); setGeneratedPassword(''); setNewName(''); setNewEmail(''); setNewStudentId(''); setNewStudentClass(''); }}
            className={`flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'teachers' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary-600 hover:bg-primary-700'}`}
          >
            <UserPlus className="w-4 h-4" /> {activeTab === 'teachers' ? 'Create Teacher' : 'Add Student'}
          </button>
        </div>

        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required
                      placeholder={activeTab === 'teachers' ? "Teacher's full name" : "Student's full name"}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  
                  {activeTab === 'teachers' ? (
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Email Address</label>
                      <input
                        type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required
                        placeholder="teacher@school.edu"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Student ID (Roll Number)</label>
                        <input
                          type="text" value={newStudentId} onChange={(e) => setNewStudentId(e.target.value)} required
                          placeholder="e.g. ST001"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Class / Grade</label>
                        <input
                          type="text" value={newStudentClass} onChange={(e) => setNewStudentClass(e.target.value)} required
                          placeholder="e.g. 10th Grade"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2">
                    <button type="submit" disabled={isSubmitting} className={`text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'teachers' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary-600 hover:bg-primary-700'} disabled:opacity-50`}>
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {activeTab === 'teachers' ? 'Generate Credentials & Create' : 'Save Student Record'}
                    </button>
                  </div>
                </form>

                {generatedPassword && activeTab === 'teachers' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-5"
                  >
                    <p className="text-sm font-semibold text-emerald-300 mb-3">✅ Account Created! Share these credentials:</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-slate-900 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-mono">{newEmail}</span>
                        </div>
                        <button onClick={() => copyToClipboard(newEmail)} className="text-slate-400 hover:text-white">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between bg-slate-900 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-mono">
                            {showPassword ? generatedPassword : '••••••••••••'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-white">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button onClick={() => copyToClipboard(generatedPassword)} className="text-slate-400 hover:text-white">
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data Table */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-700">
                    <th className="p-4 font-medium">Name</th>
                    {activeTab === 'teachers' ? (
                      <>
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium hidden sm:table-cell">Status</th>
                      </>
                    ) : (
                      <>
                        <th className="p-4 font-medium">Student ID</th>
                        <th className="p-4 font-medium">Class</th>
                      </>
                    )}
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {activeTab === 'teachers' ? teachers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-4 font-medium text-white">{t.name}</td>
                      <td className="p-4 text-slate-300">{t.email}</td>
                      <td className="p-4 hidden sm:table-cell">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          t.status === 'active' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {t.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDelete(t.id)} className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors" title="Remove">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )) : students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-4 font-medium text-white">{s.name}</td>
                      <td className="p-4 text-slate-300">{s.student_id}</td>
                      <td className="p-4 text-slate-300">{s.class_name}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDelete(s.id)} className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors" title="Remove">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {((activeTab === 'teachers' && teachers.length === 0) || (activeTab === 'students' && students.length === 0)) && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500">
                        No records found in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
