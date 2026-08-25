import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Users, GraduationCap, Plus, Search, Trash2, Edit3, 
  ArrowRight, ShieldCheck, UserCheck, Calendar, Clock, Award, 
  Building, Sparkles, CheckCircle2, ChevronRight, ArrowLeft, RefreshCw,
  Fingerprint, Camera, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import { 
  getStoredClasses, saveNewClass, removeClass, 
  getStoredDepartments, saveNewDepartment, removeDepartment 
} from '../utils/academicData';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } } };

export default function Classes() {
  const [activeTab, setActiveTab] = useState('classes'); // 'classes' or 'departments'
  const [classList, setClassList] = useState(getStoredClasses());
  const [deptList, setDeptList] = useState(getStoredDepartments());

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState(null); // When clicked, shows class details
  
  // Modals
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDept, setNewClassDept] = useState(deptList[0] || 'Computer Science');
  const [newClassTeacher, setNewClassTeacher] = useState('');

  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'class'|'dept', name: string }

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stRes, tcRes, attRes] = await Promise.allSettled([
        fetch('/api/students').then(r => r.json()),
        fetch('/api/teachers').then(r => r.json()),
        fetch('/api/attendance/today').then(r => r.json())
      ]);

      if (stRes.status === 'fulfilled' && stRes.value?.data) {
        setStudents(stRes.value.data);
      }
      if (tcRes.status === 'fulfilled' && tcRes.value?.data) {
        setTeachers(tcRes.value.data);
        if (tcRes.value.data.length > 0 && !newClassTeacher) {
          setNewClassTeacher(tcRes.value.data[0].id || tcRes.value.data[0].name);
        }
      }
      if (attRes.status === 'fulfilled' && attRes.value?.data) {
        setAttendanceLogs(attRes.value.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load academic records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Class analytics mapper
  const classDataMap = useMemo(() => {
    const map = {};
    classList.forEach(cls => {
      const classStudents = students.filter(s => s.class_name === cls || s.class_name?.startsWith(cls));
      const classTeacher = teachers.find(t => t.assigned_class === cls || t.assigned_class?.startsWith(cls));
      
      const totalStudents = classStudents.length;
      let avgRate = 0;
      if (totalStudents > 0) {
        const sum = classStudents.reduce((acc, s) => acc + (s.attendance_pct || 85), 0);
        avgRate = Math.round(sum / totalStudents);
      }

      map[cls] = {
        name: cls,
        teacher: classTeacher || null,
        students: classStudents,
        totalStudents,
        averageAttendance: avgRate
      };
    });
    return map;
  }, [classList, students, teachers]);

  const handleCreateClass = (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return toast.error('Class code/name is required');
    const updated = saveNewClass(newClassName.trim());
    setClassList(updated);
    setShowAddClass(false);
    setNewClassName('');
    toast.success(`Class "${newClassName.trim()}" created successfully!`);
  };

  const handleCreateDept = (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return toast.error('Department name is required');
    const updated = saveNewDepartment(newDeptName.trim());
    setDeptList(updated);
    setShowAddDept(false);
    setNewDeptName('');
    toast.success(`Department "${newDeptName.trim()}" created successfully!`);
  };

  const handleDeleteItem = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'class') {
      const updated = removeClass(deleteConfirm.name);
      setClassList(updated);
      toast.success(`Class ${deleteConfirm.name} removed`);
      if (selectedClass?.name === deleteConfirm.name) setSelectedClass(null);
    } else {
      const updated = removeDepartment(deleteConfirm.name);
      setDeptList(updated);
      toast.success(`Department ${deleteConfirm.name} removed`);
    }
    setDeleteConfirm(null);
  };

  // Filtered views
  const filteredClasses = classList.filter(c => c.toLowerCase().includes(search.toLowerCase()));
  const filteredDepts = deptList.filter(d => d.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Academic Classes & Fields</h1>
            <span className="bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-primary-200 dark:border-primary-800/50">
              Institutional Hierarchy
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage academic class divisions, assigned faculty, enrolled students, and classroom attendance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {activeTab === 'classes' ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddClass(true)}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-primary-600/20 transition-all text-sm"
            >
              <Plus className="w-4 h-4" /> Create Class
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddDept(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-emerald-600/20 transition-all text-sm"
            >
              <Plus className="w-4 h-4" /> Add Field / Dept
            </motion.button>
          )}
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit border border-slate-200/60 dark:border-slate-700">
          <button
            onClick={() => { setActiveTab('classes'); setSelectedClass(null); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'classes'
                ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Classes ({classList.length})
          </button>
          <button
            onClick={() => { setActiveTab('departments'); setSelectedClass(null); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'departments'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building className="w-4 h-4" /> Departments / Fields ({deptList.length})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={activeTab === 'classes' ? 'Search classes...' : 'Search departments...'}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-slate-100 shadow-sm"
          />
        </div>
      </div>

      {/* Main Content Area: Classes Tab */}
      {activeTab === 'classes' && !selectedClass && (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map(cls => {
            const data = classDataMap[cls] || { totalStudents: 0, averageAttendance: 0, teacher: null };
            return (
              <motion.div
                key={cls}
                variants={item}
                onClick={() => setSelectedClass(data)}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 flex items-center justify-center font-bold text-lg border border-primary-200 dark:border-primary-800/40 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                          {cls}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          {data.totalStudents} Enrolled Students
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ type: 'class', name: cls });
                      }}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Delete class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Assigned Teacher Box */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 mb-4 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {data.teacher?.avatar_url ? (
                        <img src={data.teacher.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover border border-emerald-500/40" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          {(data.teacher?.name || 'T').charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                          {data.teacher?.name || 'No Teacher Assigned'}
                        </p>
                        <p className="text-[10px] text-slate-400">{data.teacher ? 'Faculty Incharge' : 'Unassigned'}</p>
                      </div>
                    </div>
                    {data.teacher?.biometric_enrolled && (
                      <span className="p-1 bg-emerald-100 text-emerald-700 rounded-md" title="Touch ID Active">
                        <Fingerprint className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="pt-3 border-t border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {data.averageAttendance}% Avg Attendance
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-primary-600 group-hover:translate-x-1 transition-transform">
                    <span>View Roster</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Class Detailed View (When a card is clicked) */}
      {selectedClass && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Back button */}
          <button
            onClick={() => setSelectedClass(null)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Classes
          </button>

          {/* Class Header Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-primary-600/20">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedClass.name}</h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Academic Classroom Division • {selectedClass.totalStudents} Registered Students
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Attendance Rate</p>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">{selectedClass.averageAttendance}%</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Enrolled</p>
                <p className="text-xl font-bold text-primary-600 mt-0.5">{selectedClass.totalStudents}</p>
              </div>
            </div>
          </div>

          {/* Assigned Faculty Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Assigned Faculty Incharge
              </h3>
            </div>

            {selectedClass.teacher ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
                <div className="flex items-center gap-4">
                  {selectedClass.teacher.avatar_url ? (
                    <img src={selectedClass.teacher.avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl">
                      {(selectedClass.teacher.name || 'T').charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">{selectedClass.teacher.name}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedClass.teacher.teacher_id || selectedClass.teacher.id}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedClass.teacher.email}</span>
                      <span>• {selectedClass.teacher.department}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                    selectedClass.teacher.biometric_enrolled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {selectedClass.teacher.biometric_enrolled ? 'Touch ID Enrolled ✓' : 'Biometric Pending'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-600" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No Teacher Assigned to {selectedClass.name}</p>
                <p className="text-xs text-slate-400 mt-1">Assign a teacher by editing faculty profiles under Faculty & Teachers.</p>
              </div>
            )}
          </div>

          {/* Enrolled Students in this Class */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary-600" />
                  Enrolled Students Roster ({selectedClass.students.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Students registered under {selectedClass.name}</p>
              </div>
            </div>

            {selectedClass.students.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedClass.students.map(s => (
                  <div key={s.id || s.student_id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {s.avatar_url ? (
                        <img src={s.avatar_url} alt="" className="w-11 h-11 rounded-xl object-cover border border-primary-500/40" />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                          {(s.name || 'S').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{s.name}</p>
                        <p className="text-[11px] font-mono text-slate-400">{s.student_id}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[10px] font-bold ${
                            (s.attendance_pct || 85) >= 80 ? 'text-emerald-600' : 'text-rose-500'
                          }`}>
                            {s.attendance_pct || 85}% Attendance
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {s.biometric_enrolled && (
                        <span className="text-emerald-600 text-[10px] font-semibold flex items-center gap-0.5">
                          <Fingerprint className="w-3 h-3" /> Touch ID
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {s.face_count || 0}/100 Faces
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary-600" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No Students in {selectedClass.name}</p>
                <p className="text-xs text-slate-400 mt-1">Enroll students into this class using the Students management page.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Main Content Area: Departments / Fields Tab */}
      {activeTab === 'departments' && (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepts.map(dept => {
            const deptTeachers = teachers.filter(t => t.department === dept || t.department?.includes(dept));
            const deptStudents = students.filter(s => s.course === dept || s.course?.includes(dept));

            return (
              <motion.div
                key={dept}
                variants={item}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-200 dark:border-emerald-800/40">
                        <Building className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">{dept}</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Academic Department</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setDeleteConfirm({ type: 'dept', name: dept })}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Delete department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Faculty Count</p>
                      <p className="text-lg font-bold text-emerald-600 mt-0.5">{deptTeachers.length}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Students</p>
                      <p className="text-lg font-bold text-primary-600 mt-0.5">{deptStudents.length}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 dark:border-slate-700/50 mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>Status: Active</span>
                  <span className="font-semibold text-emerald-600">Verified Department ✓</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Add New Class Modal */}
      <Modal isOpen={showAddClass} onClose={() => setShowAddClass(false)} title="Create New Academic Class" size="md">
        <form onSubmit={handleCreateClass} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Class Code / Name *
            </label>
            <input
              type="text"
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
              placeholder="e.g. CS-501 (Robotics Lab)"
              required
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Department / Discipline
            </label>
            <select
              value={newClassDept}
              onChange={e => setNewClassDept(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500"
            >
              {deptList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setShowAddClass(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md"
            >
              Create Class
            </button>
          </div>
        </form>
      </Modal>

      {/* Add New Department Modal */}
      <Modal isOpen={showAddDept} onClose={() => setShowAddDept(false)} title="Add Academic Department / Field" size="md">
        <form onSubmit={handleCreateDept} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Department / Field Name *
            </label>
            <input
              type="text"
              value={newDeptName}
              onChange={e => setNewDeptName(e.target.value)}
              placeholder="e.g. Cybersecurity & Network Security"
              required
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setShowAddDept(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md"
            >
              Add Department
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteItem}
        title={`Delete ${deleteConfirm?.type === 'class' ? 'Class' : 'Department'}?`}
        message={`Are you sure you want to remove "${deleteConfirm?.name}"?`}
        confirmLabel="Delete"
        danger
      />
    </motion.div>
  );
}
