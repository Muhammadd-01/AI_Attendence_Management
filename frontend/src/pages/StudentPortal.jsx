import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, Clock, XCircle, Calendar,
  Award, TrendingUp, Activity, User
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import { formatTime } from '../utils/formatters';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function StudentPortal() {
  const { user } = useApp();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyData = async () => {
      try {
        const res = await fetch(`/api/attendance?student_id=${user.id}`).then(r => r.json());
        if (res.success && res.data) {
          const records = res.data;
          setHistory(records);
          
          let p = 0, a = 0, l = 0;
          records.forEach(r => {
            if (r.status === 'present') p++;
            else if (r.status === 'absent') a++;
            else if (r.status === 'late') l++;
          });
          setStats({ present: p, absent: a, late: l, total: records.length });
        }
      } catch (err) {
        console.error("Failed to fetch student attendance", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyData();
  }, [user.id]);

  if (loading) {
    return <div className="h-full flex items-center justify-center">Loading your portal...</div>;
  }

  const attendanceRate = stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div variants={item} className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Award className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
          <p className="text-primary-100 flex items-center gap-2">
            <User className="w-4 h-4" /> {user.id} | {user.assignedClass} - {user.department}
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl"><CheckCircle className="w-8 h-8" /></div>
          <div><p className="text-sm font-medium text-slate-500">Presents</p><h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.present}</h3></div>
        </motion.div>
        
        <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl"><Clock className="w-8 h-8" /></div>
          <div><p className="text-sm font-medium text-slate-500">Lates</p><h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.late}</h3></div>
        </motion.div>
        
        <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-2xl"><XCircle className="w-8 h-8" /></div>
          <div><p className="text-sm font-medium text-slate-500">Absents</p><h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.absent}</h3></div>
        </motion.div>

        <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-2xl"><TrendingUp className="w-8 h-8" /></div>
          <div><p className="text-sm font-medium text-slate-500">Attendance Rate</p><h3 className="text-2xl font-bold text-slate-900 dark:text-white">{attendanceRate}%</h3></div>
        </motion.div>
      </div>

      {/* History Table */}
      <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Attendance History</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Time In</th>
                <th className="px-6 py-4 font-semibold">Time Out</th>
                <th className="px-6 py-4 font-semibold">Method</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.length > 0 ? (
                history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                      {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {record.check_in ? formatTime(record.check_in) : '--:--'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {record.check_out ? formatTime(record.check_out) : '--:--'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {record.method === 'face' ? 'Face AI' : record.method === 'fingerprint' ? 'Biometrics' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={record.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
