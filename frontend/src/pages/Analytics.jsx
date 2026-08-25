import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, PieChart, Users, Award, UserX } from 'lucide-react';
import StatCard from '../components/StatCard';
import TrendLineChart from '../charts/TrendLineChart';
import AttendanceBarChart from '../charts/AttendanceBarChart';
import AttendancePieChart from '../charts/AttendancePieChart';
import AttendanceAreaChart from '../charts/AttendanceAreaChart';

// ── Mock Data ──────────────────────────────────────────────────
const MOCK_DAILY_TREND = [
  { date: 'Aug 19', rate: 82 }, { date: 'Aug 20', rate: 87 }, { date: 'Aug 21', rate: 79 },
  { date: 'Aug 22', rate: 91 }, { date: 'Aug 23', rate: 85 }, { date: 'Aug 24', rate: 88 }, { date: 'Aug 25', rate: 75 },
];
const MOCK_MONTHLY = [
  { month: 'Mar', rate: 82 }, { month: 'Apr', rate: 78 }, { month: 'May', rate: 85 },
  { month: 'Jun', rate: 90 }, { month: 'Jul', rate: 87 }, { month: 'Aug', rate: 84 },
];
const MOCK_CLASS_CHART = [
  { date: 'CS-401', present: 4, absent: 1 },
  { date: 'CS-402', present: 3, absent: 1 },
];
const MOCK_ANOMALIES = [
  { id: 1, message: 'Ahmed Khan has missed 4 consecutive sessions', severity: 'high' },
  { id: 2, message: 'Usman Ali attendance below 75%', severity: 'medium' },
  { id: 3, message: 'Zainab Malik attendance below 60% — at risk', severity: 'high' },
  { id: 4, message: 'CS-402 average attendance declining over last 3 weeks', severity: 'low' },
];
const MOST_ABSENT = [
  { rank: 1, name: 'Zainab Malik', student_id: 'ST007', absences: 12, rate: 55, trend: 'down' },
  { rank: 2, name: 'Ibrahim Qureshi', student_id: 'ST008', absences: 10, rate: 62, trend: 'down' },
  { rank: 3, name: 'Usman Ali', student_id: 'ST006', absences: 8, rate: 70, trend: 'up' },
  { rank: 4, name: 'Ahmed Khan', student_id: 'ST003', absences: 6, rate: 76, trend: 'down' },
];
// ────────────────────────────────────────────────────────────────

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

export default function Analytics() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <p className="text-gray-500 mt-1">Deep insights into attendance patterns</p>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Overall Rate" value="84.2%" icon={BarChart3} color="primary" trend="+2.1%" trendUp={true} />
        <StatCard title="Avg Daily Present" value="6.5" icon={Users} color="success" />
        <StatCard title="Most Consistent" value="Sara Ahmed" icon={Award} color="warning" />
        <StatCard title="Highest Absence" value="Zainab Malik" icon={UserX} color="danger" />
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Attendance Trend</h3>
          <TrendLineChart data={MOCK_DAILY_TREND} height={260} />
        </motion.div>
        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Comparison</h3>
          <AttendanceAreaChart data={MOCK_MONTHLY} height={260} />
        </motion.div>
        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Distribution</h3>
          <AttendancePieChart present={160} absent={25} late={15} />
        </motion.div>
        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Class Comparison</h3>
          <AttendanceBarChart data={MOCK_CLASS_CHART} height={260} />
        </motion.div>
      </div>

      {/* Anomalies */}
      <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <h3 className="text-lg font-semibold text-gray-800">Attendance Alerts</h3>
        </div>
        <div className="space-y-3">
          {MOCK_ANOMALIES.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                a.severity === 'high' ? 'bg-red-50/50 border-red-200' : a.severity === 'medium' ? 'bg-amber-50/50 border-amber-200' : 'bg-blue-50/50 border-blue-200'
              }`}>
              <AlertTriangle className={`w-4 h-4 mt-0.5 ${a.severity === 'high' ? 'text-danger' : a.severity === 'medium' ? 'text-warning' : 'text-info'}`} />
              <span className="text-sm text-gray-700">{a.message}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Most Absent Students */}
      <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Absent Students</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Rank</th>
                <th className="pb-3 font-medium">Student</th>
                <th className="pb-3 font-medium">Absences</th>
                <th className="pb-3 font-medium">Rate</th>
                <th className="pb-3 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {MOST_ABSENT.map((s, i) => (
                <motion.tr key={s.student_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 + i * 0.06 }}
                  className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      s.rank === 1 ? 'bg-danger' : s.rank === 2 ? 'bg-warning' : 'bg-gray-400'
                    }`}>{s.rank}</span>
                  </td>
                  <td className="py-3">
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.student_id}</p>
                  </td>
                  <td className="py-3 font-semibold text-danger">{s.absences}</td>
                  <td className="py-3">
                    <span className={`font-semibold ${s.rate >= 75 ? 'text-success' : 'text-danger'}`}>{s.rate}%</span>
                  </td>
                  <td className="py-3">
                    {s.trend === 'up' ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-danger" />}
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
