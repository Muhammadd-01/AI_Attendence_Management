import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Calendar, User, BarChart2, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';
import StatCard from '../components/StatCard';
import AttendanceBarChart from '../charts/AttendanceBarChart';
import TrendLineChart from '../charts/TrendLineChart';
import StatusBadge from '../components/StatusBadge';
import { getDailyReport, getMonthlyReport, getStudentReport, exportCSV } from '../services/reportsApi';
import { getStudents } from '../services/studentApi';
import toast from 'react-hot-toast';

const tabs = [
  { key: 'daily', label: 'Daily Log', icon: Calendar },
  { key: 'monthly', label: 'Monthly Summary', icon: BarChart2 },
  { key: 'student', label: 'Student Report', icon: User },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  
  // Real report data states
  const [dailyData, setDailyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load student list for the student dropdown
    getStudents().then(res => {
      const list = res?.data || res || [];
      setStudents(list);
      if (list.length > 0) {
        setSelectedStudent(list[0].student_id || list[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchReport();
  }, [activeTab, selectedDate, selectedStudent]);

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
      const blob = await exportCSV({ date: activeTab === 'daily' ? selectedDate : undefined });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${selectedDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('CSV Report exported successfully!');
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Reports & Logs</h2>
          <p className="text-slate-500 text-sm mt-0.5">Generate real institutional attendance audits and export data</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-emerald-600/20 transition-all text-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit border border-slate-200/60 dark:border-slate-700">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button 
              key={t.key} 
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === t.key 
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab} 
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
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-slate-100 font-medium shadow-sm outline-none focus:ring-2 focus:ring-primary-500" 
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Total" value={dailyData?.total ?? 0} icon={FileText} color="primary" />
                <StatCard title="Present" value={dailyData?.present ?? 0} icon={FileText} color="success" />
                <StatCard title="Late" value={dailyData?.late ?? 0} icon={FileText} color="warning" />
                <StatCard title="Absent" value={dailyData?.absent ?? 0} icon={FileText} color="danger" />
                <StatCard title="Attendance Rate" value={`${dailyData?.attendance_rate ?? 0}%`} icon={FileText} color="info" />
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">IN Time</th>
                      <th className="px-6 py-4">OUT Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    {dailyData?.records && dailyData.records.length > 0 ? (
                      dailyData.records.map((r, i) => (
                        <tr key={r.id || i} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-3 font-semibold text-slate-800 dark:text-slate-200">{r.student_name || r.name}</td>
                          <td className="px-6 py-3 font-mono text-xs text-slate-500">{r.student_id}</td>
                          <td className="px-6 py-3"><StatusBadge status={r.status || 'Present'} /></td>
                          <td className="px-6 py-3 text-slate-500 text-xs">{r.check_in_time || '—'}</td>
                          <td className="px-6 py-3 text-slate-500 text-xs">{r.check_out_time || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">
                          No attendance records found for {selectedDate}.
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
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-6">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  Monthly Daily Attendance Breakdown
                </h3>
                {monthlyData?.days && monthlyData.days.length > 0 ? (
                  <AttendanceBarChart data={monthlyData.days} height={300} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
                    No monthly data recorded for this period
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'student' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <select 
                  value={selectedStudent} 
                  onChange={e => setSelectedStudent(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-slate-100 font-medium shadow-sm outline-none focus:ring-2 focus:ring-primary-500 max-w-xs"
                >
                  {students.map(st => (
                    <option key={st.student_id || st.id} value={st.student_id || st.id}>
                      {st.name} ({st.student_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Sessions" value={studentData?.total_sessions ?? 0} icon={FileText} color="primary" />
                <StatCard title="Present" value={studentData?.present ?? 0} icon={FileText} color="success" />
                <StatCard title="Absent" value={studentData?.absent ?? 0} icon={FileText} color="danger" />
                <StatCard title="Attendance Rate" value={`${studentData?.attendance_rate ?? 0}%`} icon={FileText} color="warning" />
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-6">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  Student Attendance History
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold uppercase">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Check IN</th>
                        <th className="pb-3">Check OUT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                      {studentData?.history && studentData.history.length > 0 ? (
                        studentData.history.map((h, i) => (
                          <tr key={h.id || i} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                            <td className="py-3 text-slate-700 dark:text-slate-200 font-medium">{h.date}</td>
                            <td className="py-3"><StatusBadge status={h.status || 'Present'} /></td>
                            <td className="py-3 text-slate-500 text-xs">{h.check_in_time || '—'}</td>
                            <td className="py-3 text-slate-500 text-xs">{h.check_out_time || '—'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400 text-sm">
                            No attendance history found for this student.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
