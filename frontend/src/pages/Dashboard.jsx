import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, UserX, TrendingUp, Activity, Clock, 
  ArrowUpRight, RefreshCw, Video, Sparkles, Fingerprint, 
  BookOpen, ShieldCheck, ChevronRight, Award, Zap
} from 'lucide-react';
import AttendanceBarChart from '../charts/AttendanceBarChart';
import TrendLineChart from '../charts/TrendLineChart';
import StatusBadge from '../components/StatusBadge';
import { getStats, getRecentActivity, getWeeklyTrend, getMonthlyTrend } from '../services/dashboardApi';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

import StudentPortal from './StudentPortal';

const container = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1, 
    transition: { staggerChildren: 0.06, delayChildren: 0.05 } 
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { sessionActive, user } = useApp();
  
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

  if (user?.role === 'student') {
    return <StudentPortal />;
  }

  const fetchDashboardData = async () => {
    try {
      const [statsRes, weeklyRes, monthlyRes, recentRes] = await Promise.allSettled([
        getStats(user?.role, user?.assignedClass),
        getWeeklyTrend(user?.role, user?.assignedClass),
        getMonthlyTrend(user?.role, user?.assignedClass),
        getRecentActivity(user?.role, user?.assignedClass)
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
      <div className="flex flex-col items-center justify-center h-[55vh] gap-3">
        <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading AI Attendance Engine...</p>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      
      {/* Studio Mission Station Hero */}
      <motion.div 
        variants={item}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-emerald-300 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" />
                {sessionActive ? 'Live Recognition Streaming' : 'Biometric AI Engine Ready'}
              </span>
              <span className="text-xs text-slate-400">• Institutional Terminal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-teal-200 to-emerald-300">{user?.name || 'Administrator'}</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Automated computer vision attendance pipeline connected to Firestore and Supabase biometric face models.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/live-attendance')}
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Video className="w-4 h-4" />
              <span>{sessionActive ? 'Open Live Vision' : 'Launch AI Camera'}</span>
              <ChevronRight className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/classes')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-xs sm:text-sm border border-white/15 transition-all"
            >
              <BookOpen className="w-4 h-4 text-primary-300" />
              <span>Classes & Rosters</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Floating Glass Metric Pods */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between hover:border-primary-500/40 transition-colors">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Enrolled</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {stats.totalStudents}
            </p>
            <span className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold flex items-center gap-0.5 mt-1">
              Verified Profiles ✓
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between hover:border-emerald-500/40 transition-colors">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Present Today</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {stats.presentToday}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
              Live Attended ✓
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Absent Today */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between hover:border-rose-500/40 transition-colors">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Absent Today</p>
            <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
              {stats.absentToday}
            </p>
            <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 mt-1">
              Pending Check-in
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between hover:border-amber-500/40 transition-colors">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Rate</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
              {stats.attendanceRate}%
            </p>
            <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5 mt-1">
              {stats.attendanceRate >= 80 ? 'Optimal Performance 🚀' : 'Action Required ⚠️'}
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </motion.div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">Weekly Attendance Pulse</h3>
              <p className="text-xs text-slate-400 mt-0.5">Past 7 days Present vs Absent distribution</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
              Live Chart
            </span>
          </div>
          <div className="pt-2">
            <AttendanceBarChart data={weeklyTrend} height={260} />
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">Attendance Trajectory</h3>
              <p className="text-xs text-slate-400 mt-0.5">30-day institutional consistency curve</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-lg">
              {stats.attendanceRate}% Trend
            </span>
          </div>
          <div className="pt-2">
            <TrendLineChart data={monthlyTrend} height={260} />
          </div>
        </motion.div>
      </div>

      {/* Live Activity Feed */}
      <motion.div variants={item} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Recent Verified Activities</h3>
              <p className="text-xs text-slate-400 mt-0.5">Live facial recognition check-in stream</p>
            </div>
          </div>

          <button 
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Feed
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-3">Attendee</th>
                <th className="pb-3">Roll ID</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Verification</th>
                <th className="pb-3">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/60">
              {recentActivity.length > 0 ? (
                recentActivity.map((r, i) => (
                  <tr key={r.id || i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {r.student_name || r.name}
                    </td>
                    <td className="py-3.5 font-mono text-xs text-slate-500">{r.student_id}</td>
                    <td className="py-3.5 text-xs text-slate-600 dark:text-slate-300 font-mono">
                      {r.check_in_time || r.time || '—'}
                    </td>
                    <td className="py-3.5"><StatusBadge status={r.status || 'Present'} /></td>
                    <td className="py-3.5 font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {Math.round((r.confidence || 0.95) * 100)}% Match
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No recent activities recorded yet today.
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
