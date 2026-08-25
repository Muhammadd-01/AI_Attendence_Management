import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, TrendingUp, Activity, Clock, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import StatCard from '../components/StatCard';
import AttendanceBarChart from '../charts/AttendanceBarChart';
import TrendLineChart from '../charts/TrendLineChart';
import StatusBadge from '../components/StatusBadge';
import { getStats, getRecentActivity, getWeeklyTrend, getMonthlyTrend } from '../services/dashboardApi';
import toast from 'react-hot-toast';

const container = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1, 
    transition: { 
      staggerChildren: 0.08,
      delayChildren: 0.1
    } 
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0
  });
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, weeklyRes, monthlyRes, recentRes] = await Promise.allSettled([
        getStats(),
        getWeeklyTrend(),
        getMonthlyTrend(),
        getRecentActivity()
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        const raw = statsRes.value.data || statsRes.value;
        setStats({
          totalStudents: raw.total_students ?? raw.totalStudents ?? 0,
          presentToday: raw.present_today ?? raw.presentToday ?? 0,
          absentToday: raw.absent_today ?? raw.absentToday ?? 0,
          attendanceRate: raw.attendance_rate ?? raw.attendanceRate ?? 0
        });
      }

      if (weeklyRes.status === 'fulfilled' && weeklyRes.value) {
        const rawW = weeklyRes.value.data || weeklyRes.value || [];
        setWeeklyTrend(Array.isArray(rawW) ? rawW : []);
      }

      if (monthlyRes.status === 'fulfilled' && monthlyRes.value) {
        const rawM = monthlyRes.value.data || monthlyRes.value || [];
        setMonthlyTrend(Array.isArray(rawM) ? rawM : []);
      }

      if (recentRes.status === 'fulfilled' && recentRes.value) {
        const rawR = recentRes.value.data || recentRes.value || [];
        setRecentActivity(Array.isArray(rawR) ? rawR : []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      toast.error('Could not refresh dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading Real Attendance Records...</p>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h2>
          <p className="text-slate-500 text-sm mt-0.5">Real-time attendance intelligence & metrics</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { setLoading(true); fetchDashboardData(); }}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </motion.button>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Total Registered" 
          value={stats.totalStudents} 
          icon={Users} 
          color="primary" 
          trend="Enrolled" 
          trendUp={true} 
        />
        <StatCard 
          title="Present Today" 
          value={stats.presentToday} 
          icon={UserCheck} 
          color="success" 
          trend="Real Check-in" 
          trendUp={true} 
        />
        <StatCard 
          title="Absent Today" 
          value={stats.absentToday} 
          icon={UserX} 
          color="danger" 
          trend="Unrecorded" 
          trendUp={false} 
        />
        <StatCard 
          title="Attendance Rate" 
          value={`${stats.attendanceRate}%`} 
          icon={TrendingUp} 
          color="warning" 
          trend="Overall" 
          trendUp={stats.attendanceRate >= 75} 
        />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Weekly Attendance Breakdown</h3>
            <span className="text-xs text-slate-400 font-medium">Last 7 Days</span>
          </div>
          {weeklyTrend.length > 0 ? (
            <AttendanceBarChart data={weeklyTrend} height={280} />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
              No weekly data available yet
            </div>
          )}
        </motion.div>

        <motion.div variants={item} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Monthly Attendance Trend</h3>
            <span className="text-xs text-slate-400 font-medium">Last 30 Days</span>
          </div>
          {monthlyTrend.length > 0 ? (
            <TrendLineChart data={monthlyTrend} height={280} />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
              No monthly trend data available yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={item} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Recent Attendance Logs</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time check-ins and system verifications</p>
          </div>
          <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-full border border-emerald-200 dark:border-emerald-800/40">
            <Activity className="w-3.5 h-3.5 mr-1 animate-pulse" />
            Live Sync
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-3">Student</th>
                <th className="pb-3">ID</th>
                <th className="pb-3">Date / Time</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {recentActivity.length > 0 ? (
                recentActivity.map((r, i) => (
                  <motion.tr
                    key={r.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {r.student_name || r.name || 'Student'}
                    </td>
                    <td className="py-3 font-mono text-xs text-slate-500">{r.student_id || '-'}</td>
                    <td className="py-3 text-slate-500 text-xs flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      {r.check_in_time || r.time || r.date || 'Today'}
                    </td>
                    <td className="py-3"><StatusBadge status={r.status || 'Present'} /></td>
                    <td className="py-3">
                      <span className={`font-semibold text-xs ${
                        (r.confidence || 0.95) >= 0.85 ? 'text-emerald-600' : 'text-amber-500'
                      }`}>
                        {Math.round((r.confidence || 0.95) * 100)}% Match
                      </span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    No recent attendance events recorded today.
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
