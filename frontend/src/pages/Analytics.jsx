import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, PieChart, Users, Award, UserX, RefreshCw } from 'lucide-react';
import StatCard from '../components/StatCard';
import TrendLineChart from '../charts/TrendLineChart';
import AttendanceBarChart from '../charts/AttendanceBarChart';
import AttendancePieChart from '../charts/AttendancePieChart';
import AttendanceAreaChart from '../charts/AttendanceAreaChart';
import { getAnalytics } from '../services/analyticsApi';
import { getMonthlyTrend } from '../services/dashboardApi';
import toast from 'react-hot-toast';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } } };

export default function Analytics() {
  const [data, setData] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const [res, mRes] = await Promise.allSettled([
        getAnalytics(),
        getMonthlyTrend()
      ]);

      if (res.status === 'fulfilled' && res.value) {
        setData(res.value.data || res.value);
      }
      if (mRes.status === 'fulfilled' && mRes.value) {
        setMonthlyTrend(mRes.value.data || mRes.value || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Computing AI Analytics & Anomalies...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const distribution = data?.distribution || { present: 0, late: 0, absent: 0 };
  const anomalies = data?.anomalies || [];
  const mostAbsent = data?.most_absent || [];
  const classStats = (data?.classes || []).map(c => ({
    date: c.class_name,
    present: c.students_count,
    rate: c.average_rate
  }));

  const mostConsistent = mostAbsent.length > 0 ? mostAbsent[mostAbsent.length - 1]?.name : 'None';
  const highestAbsence = mostAbsent.length > 0 ? mostAbsent[0]?.name : 'None';

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">AI Analytics & Insights</h2>
          <p className="text-slate-500 text-sm mt-0.5">Deep biometric attendance intelligence & pattern detection</p>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchAnalytics(); }}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Overall Rate" value={`${stats.attendance_rate || 0}%`} icon={BarChart3} color="primary" trend="Institution Avg" trendUp={true} />
        <StatCard title="Present Today" value={stats.present_today || 0} icon={Users} color="success" trend="Active" trendUp={true} />
        <StatCard title="Most Consistent" value={mostConsistent} icon={Award} color="warning" />
        <StatCard title="Highest Absence" value={highestAbsence} icon={UserX} color="danger" />
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-6">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Monthly Rate Comparison</h3>
          <AttendanceAreaChart data={monthlyTrend} height={260} />
        </motion.div>

        <motion.div variants={item} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-6">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Attendance Distribution</h3>
          <AttendancePieChart present={distribution.present || 1} absent={distribution.absent || 0} late={distribution.late || 0} />
        </motion.div>

        <motion.div variants={item} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-6">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Class Performance Comparison</h3>
          <AttendanceBarChart data={classStats} height={260} />
        </motion.div>

        {/* Anomalies */}
        <motion.div variants={item} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">AI Attendance Alerts</h3>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[260px] custom-scrollbar pr-1 flex-1">
            {anomalies.length > 0 ? (
              anomalies.map((a, i) => (
                <motion.div 
                  key={a.student_id || i} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800/40"
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {a.student_name} ({a.student_id}) — {a.class_name}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                      {a.reasons?.join(', ')}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8 text-center text-xs">
                <p>No high-risk attendance anomalies detected.</p>
                <p className="text-[11px] text-slate-400 mt-1">All students maintain healthy attendance rates.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Most Absent Students */}
      <motion.div variants={item} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Student Attendance Rankings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold uppercase">
                <th className="pb-3">Rank</th>
                <th className="pb-3">Student</th>
                <th className="pb-3">Class</th>
                <th className="pb-3">Total Absences</th>
                <th className="pb-3">Attendance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {mostAbsent.map((s, i) => (
                <motion.tr 
                  key={s.student_id || i} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: 0.1 + i * 0.04 }}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="py-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      i === 0 ? 'bg-rose-500' : i === 1 ? 'bg-amber-500' : 'bg-slate-400'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                    <p>{s.name}</p>
                    <p className="text-[11px] font-mono text-slate-400">{s.student_id}</p>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300 text-xs">{s.class_name || 'CS-401'}</td>
                  <td className="py-3 font-semibold text-rose-500">{s.absences || 0} days</td>
                  <td className="py-3">
                    <span className={`font-semibold text-xs ${
                      (s.attendance_rate || 0) >= 75 ? 'text-emerald-600' : 'text-rose-500'
                    }`}>
                      {s.attendance_rate || 0}%
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
