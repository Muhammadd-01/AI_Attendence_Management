import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Download, Calendar, User, BarChart2, RefreshCw, 
  Clock, CheckCircle2, Users, GraduationCap
} from 'lucide-react';
import StatCard from '../components/StatCard';
import AttendanceBarChart from '../charts/AttendanceBarChart';
import TrendLineChart from '../charts/TrendLineChart';
import StatusBadge from '../components/StatusBadge';
import { getDailyReport, getMonthlyReport, getStudentReport, exportCSV } from '../services/reportsApi';
import { getStudents } from '../services/studentApi';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

export default function Reports() {
  const { user } = useApp();
  const isPrincipal = user?.role === 'principal';

  const [activeTab, setActiveTab] = useState('daily');
  const [personTypeFilter, setPersonTypeFilter] = useState('student'); // 'student' or 'teacher'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  
  // Real report data states
  const [dailyData, setDailyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load student and teacher lists
    getStudents().then(res => {
      const list = res?.data || res || [];
      setStudents(list);
      if (list.length > 0) {
        setSelectedStudent(list[0].student_id || list[0].id);
      }
    }).catch(console.error);

    fetch('/api/teachers')
      .then(r => r.json())
      .then(json => {
        if (json.data && json.data.length > 0) {
          setTeachers(json.data);
          setSelectedTeacher(json.data[0].teacher_id || json.data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchReport();
  }, [activeTab, selectedDate, selectedStudent, personTypeFilter]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (activeTab === 'daily') {
        const res = await getDailyReport(selectedDate);
        setDailyData(res?.data || res);
      } else if (activeTab === 'monthly') {
        const [year, month] = selectedDate.split('-');
        const res = await getMonthlyReport(month, year);
        setMonthlyData(res?.data || res);
      } else if (activeTab === 'student' && selectedStudent) {
        const res = await getStudentReport(selectedStudent);
        setStudentData(res?.data || res);
      }
    } catch (err) {
      console.error('Failed to load report', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await exportCSV({ 
        date: activeTab === 'daily' ? selectedDate : undefined,
        person_type: personTypeFilter
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${personTypeFilter}_attendance_report_${selectedDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('CSV Report exported successfully!');
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  };

  const tabs = [
    { key: 'daily', label: 'Daily Audit Log', icon: Calendar },
    { key: 'monthly', label: 'Monthly Trajectory', icon: BarChart2 },
    { key: 'student', label: 'Individual Dossier', icon: User },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
            Attendance Reports & Audits
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Institutional verification logs segregated by Student and Faculty roles
          </p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl font-semibold shadow-md shadow-emerald-600/20 transition-all text-xs sm:text-sm self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> Export Verified CSV
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1 w-fit border border-slate-200/60 dark:border-slate-700">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button 
                key={t.key} 
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === t.key 
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Role Segregation Filter for Principal */}
        {isPrincipal && activeTab === 'daily' && (
          <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1 border border-slate-200/60 dark:border-slate-700 text-xs">
            <button
              onClick={() => setPersonTypeFilter('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                personTypeFilter === 'student'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Students
            </button>
            <button
              onClick={() => setPersonTypeFilter('teacher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                personTypeFilter === 'teacher'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Faculty
            </button>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={`${activeTab}-${personTypeFilter}`} 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -8 }} 
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'daily' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-semibold shadow-sm outline-none focus:ring-2 focus:ring-primary-500" 
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Total Audited" value={dailyData?.total ?? 0} icon={FileText} color="primary" />
                <StatCard title="Present" value={dailyData?.present ?? 0} icon={FileText} color="success" />
                <StatCard title="Late Check-ins" value={dailyData?.late ?? 0} icon={FileText} color="warning" />
                <StatCard title="Absent" value={dailyData?.absent ?? 0} icon={FileText} color="danger" />
                <StatCard title="Attendance Rate" value={`${dailyData?.attendance_rate ?? 0}%`} icon={FileText} color="info" />
              </div>

              <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 text-[11px] font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">{personTypeFilter === 'teacher' ? 'Faculty Member' : 'Student'}</th>
                      <th className="px-6 py-4">Role Designation</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">IN Time</th>
                      <th className="px-6 py-4">OUT Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60 dark:divide-slate-700/60">
                    {dailyData?.records && dailyData.records.length > 0 ? (
                      dailyData.records
                        .filter(r => {
                          const isTeacher = r.person_type === 'teacher' || String(r.student_id || '').startsWith('TCH');
                          return isPrincipal ? (personTypeFilter === 'teacher' ? isTeacher : !isTeacher) : !isTeacher;
                        })
                        .map((r, i) => (
                          <tr key={r.id || i} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-3.5 font-semibold text-xs text-slate-800 dark:text-slate-200">
                              {r.student_name || r.name}
                            </td>
                            <td className="px-6 py-3.5 font-mono text-[11px] text-slate-400">
                              {r.student_id} • {(r.person_type === 'teacher' || String(r.student_id || '').startsWith('TCH')) ? 'Teacher' : 'Student'}
                            </td>
                            <td className="px-6 py-3.5"><StatusBadge status={r.status || 'Present'} /></td>
                            <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 text-xs font-mono">{r.check_in_time || '—'}</td>
                            <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 text-xs font-mono">{r.check_out_time || '—'}</td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">
                          No {personTypeFilter === 'teacher' ? 'Faculty' : 'Student'} attendance records found for {selectedDate}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'monthly' && (
            <div className="space-y-6">
              <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-6">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">
                  Monthly Daily Attendance Breakdown
                </h3>
                {monthlyData?.days && monthlyData.days.length > 0 ? (
                  <AttendanceBarChart data={monthlyData.days} height={300} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-400 text-xs">
                    No monthly data recorded for this period
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'student' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <select 
                  value={selectedStudent} 
                  onChange={e => setSelectedStudent(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-semibold shadow-sm outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {students.map(s => (
                    <option key={s.student_id || s.id} value={s.student_id || s.id}>
                      {s.name} ({s.student_id || s.id}) — {s.class_name}
                    </option>
                  ))}
                </select>
              </div>

              {studentData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard title="Total Sessions" value={studentData.total_sessions ?? 0} icon={FileText} color="primary" />
                    <StatCard title="Present" value={studentData.present ?? 0} icon={CheckCircle2} color="success" />
                    <StatCard title="Absent" value={studentData.absent ?? 0} icon={FileText} color="danger" />
                    <StatCard title="Attendance Rate" value={`${studentData.attendance_rate ?? 0}%`} icon={Clock} color="info" />
                  </div>

                  <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-400 bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 text-[11px] font-semibold uppercase tracking-wider">
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Check In</th>
                          <th className="px-6 py-4">Check Out</th>
                          <th className="px-6 py-4">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/60 dark:divide-slate-700/60">
                        {studentData.history && studentData.history.length > 0 ? (
                          studentData.history.map((h, i) => (
                            <tr key={h.id || i} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="px-6 py-3.5 font-mono text-xs text-slate-700 dark:text-slate-300">{h.date}</td>
                              <td className="px-6 py-3.5"><StatusBadge status={h.status} /></td>
                              <td className="px-6 py-3.5 text-xs text-slate-500 font-mono">{h.check_in_time || '—'}</td>
                              <td className="px-6 py-3.5 text-xs text-slate-500 font-mono">{h.check_out_time || '—'}</td>
                              <td className="px-6 py-3.5 text-xs text-slate-500">{h.duration_minutes ? `${h.duration_minutes}m` : '—'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">
                              No history found for this student.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
