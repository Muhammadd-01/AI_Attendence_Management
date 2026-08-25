import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, TrendingUp, Activity, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import StatCard from '../components/StatCard';
import AttendanceBarChart from '../charts/AttendanceBarChart';
import TrendLineChart from '../charts/TrendLineChart';
import StatusBadge from '../components/StatusBadge';

// ── Mock Data ──────────────────────────────────────────────────
const MOCK_STATS = {
  totalStudents: 8,
  presentToday: 6,
  absentToday: 2,
  attendanceRate: 85.5,
};

const MOCK_WEEKLY = [
  { date: 'Mon', present: 7, absent: 1 },
  { date: 'Tue', present: 6, absent: 2 },
  { date: 'Wed', present: 8, absent: 0 },
  { date: 'Thu', present: 5, absent: 3 },
  { date: 'Fri', present: 7, absent: 1 },
  { date: 'Sat', present: 6, absent: 2 },
  { date: 'Sun', present: 4, absent: 4 },
];

const MOCK_TREND = [
  { date: 'Week 1', rate: 82 },
  { date: 'Week 2', rate: 87 },
  { date: 'Week 3', rate: 79 },
  { date: 'Week 4', rate: 91 },
  { date: 'Week 5', rate: 85 },
  { date: 'Week 6', rate: 88 },
];

const MOCK_RECENT = [
  { id: 1, name: 'Muhammad Affan', student_id: 'ST001', time: '08:12 AM', status: 'Present', confidence: 0.96 },
  { id: 2, name: 'Ali Hassan', student_id: 'ST002', time: '08:15 AM', status: 'Present', confidence: 0.94 },
  { id: 3, name: 'Ahmed Khan', student_id: 'ST003', time: '08:22 AM', status: 'Late', confidence: 0.91 },
  { id: 4, name: 'Sara Ahmed', student_id: 'ST004', time: '08:05 AM', status: 'Present', confidence: 0.97 },
  { id: 5, name: 'Fatima Zahra', student_id: 'ST005', time: '08:18 AM', status: 'Present', confidence: 0.93 },
  { id: 6, name: 'Usman Ali', student_id: 'ST006', time: '08:30 AM', status: 'Late', confidence: 0.89 },
];
// ────────────────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call — swap with real fetch later
    const t = setTimeout(() => { setStats(MOCK_STATS); setLoading(false); }, 600);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 mt-1">Overview of attendance metrics</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="primary" trend="+2" trendUp={true} />
        <StatCard title="Present Today" value={stats.presentToday} icon={UserCheck} color="success" trend="+1" trendUp={true} />
        <StatCard title="Absent Today" value={stats.absentToday} icon={UserX} color="danger" trend="-1" trendUp={false} />
        <StatCard title="Attendance Rate" value={`${stats.attendanceRate}%`} icon={TrendingUp} color="warning" trend="+3.2%" trendUp={true} />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Attendance</h3>
          <AttendanceBarChart data={MOCK_WEEKLY} height={280} />
        </motion.div>
        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Trend</h3>
          <TrendLineChart data={MOCK_TREND} height={280} />
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
          <div className="flex items-center text-xs text-success font-medium">
            <Activity className="w-3.5 h-3.5 mr-1" />
            Live
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Student</th>
                <th className="pb-3 font-medium">ID</th>
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {MOCK_RECENT.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.07 }}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-3 font-medium text-gray-900">{r.name}</td>
                  <td className="py-3 text-gray-500">{r.student_id}</td>
                  <td className="py-3 text-gray-500 flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />{r.time}</td>
                  <td className="py-3"><StatusBadge status={r.status} /></td>
                  <td className="py-3">
                    <span className={`font-semibold ${r.confidence >= 0.9 ? 'text-success' : 'text-warning'}`}>
                      {(r.confidence * 100).toFixed(0)}%
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
