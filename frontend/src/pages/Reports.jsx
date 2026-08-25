import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, User, BarChart2 } from 'lucide-react';
import StatCard from '../components/StatCard';
import AttendanceBarChart from '../charts/AttendanceBarChart';
import TrendLineChart from '../charts/TrendLineChart';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';

// ── Mock Data ──────────────────────────────────────────────────
const MOCK_DAILY = {
  date: '2026-08-25',
  total: 8, present: 6, absent: 2, late: 1, rate: 75,
  records: [
    { student_id: 'ST001', name: 'Muhammad Affan', status: 'Present', check_in: '08:12 AM', check_out: '09:45 AM' },
    { student_id: 'ST002', name: 'Ali Hassan', status: 'Present', check_in: '08:15 AM', check_out: '09:50 AM' },
    { student_id: 'ST003', name: 'Ahmed Khan', status: 'Late', check_in: '08:22 AM', check_out: null },
    { student_id: 'ST004', name: 'Sara Ahmed', status: 'Present', check_in: '08:05 AM', check_out: '09:55 AM' },
    { student_id: 'ST005', name: 'Fatima Zahra', status: 'Present', check_in: '08:18 AM', check_out: null },
    { student_id: 'ST006', name: 'Usman Ali', status: 'Late', check_in: '08:30 AM', check_out: null },
    { student_id: 'ST007', name: 'Zainab Malik', status: 'Absent', check_in: null, check_out: null },
    { student_id: 'ST008', name: 'Ibrahim Qureshi', status: 'Absent', check_in: null, check_out: null },
  ],
};

const MOCK_MONTHLY_CHART = [
  { date: '1', present: 7, absent: 1 }, { date: '2', present: 6, absent: 2 }, { date: '3', present: 8, absent: 0 },
  { date: '4', present: 5, absent: 3 }, { date: '5', present: 7, absent: 1 }, { date: '6', present: 6, absent: 2 },
  { date: '7', present: 4, absent: 4 }, { date: '8', present: 7, absent: 1 }, { date: '9', present: 8, absent: 0 },
  { date: '10', present: 6, absent: 2 },
];

const MOCK_STUDENT_TREND = [
  { date: 'Week 1', rate: 100 }, { date: 'Week 2', rate: 80 }, { date: 'Week 3', rate: 100 },
  { date: 'Week 4', rate: 60 }, { date: 'Week 5', rate: 100 }, { date: 'Week 6', rate: 80 },
];
// ────────────────────────────────────────────────────────────────

const tabs = [
  { key: 'daily', label: 'Daily', icon: Calendar },
  { key: 'monthly', label: 'Monthly', icon: BarChart2 },
  { key: 'student', label: 'Student', icon: User },
];

const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function Reports() {
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedDate, setSelectedDate] = useState('2026-08-25');
  const [selectedStudent, setSelectedStudent] = useState('ST001');

  const exportCSV = () => {
    const header = 'Student ID,Name,Status,Check In,Check Out\n';
    const rows = MOCK_DAILY.records.map(r => `${r.student_id},${r.name},${r.status},${r.check_in || ''},${r.check_out || ''}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `attendance_${selectedDate}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <p className="text-gray-500 mt-1">Generate and export attendance reports</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={exportCSV}
          className="flex items-center gap-2 bg-success text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow">
          <Download className="w-4 h-4" /> Export CSV
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {activeTab === 'daily' && (
          <div className="space-y-6">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard title="Total" value={MOCK_DAILY.total} icon={FileText} color="primary" />
              <StatCard title="Present" value={MOCK_DAILY.present} icon={FileText} color="success" />
              <StatCard title="Absent" value={MOCK_DAILY.absent} icon={FileText} color="danger" />
              <StatCard title="Late" value={MOCK_DAILY.late} icon={FileText} color="warning" />
              <StatCard title="Rate" value={`${MOCK_DAILY.rate}%`} icon={FileText} color="primary" />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 bg-gray-50/50">
                  <th className="px-6 py-4 font-medium">Student</th><th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">IN</th><th className="px-6 py-4 font-medium">OUT</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {MOCK_DAILY.records.map(r => (
                    <tr key={r.student_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900">{r.name}</td>
                      <td className="px-6 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-6 py-3 text-gray-600">{r.check_in || '—'}</td>
                      <td className="px-6 py-3 text-gray-600">{r.check_out || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Breakdown — August 2026</h3>
              <AttendanceBarChart data={MOCK_MONTHLY_CHART} height={300} />
            </div>
          </div>
        )}

        {activeTab === 'student' && (
          <div className="space-y-6">
            <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="ST001">Muhammad Affan</option>
              <option value="ST002">Ali Hassan</option>
              <option value="ST003">Ahmed Khan</option>
            </select>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Sessions" value={30} icon={FileText} color="primary" />
              <StatCard title="Present" value={27} icon={FileText} color="success" />
              <StatCard title="Absent" value={3} icon={FileText} color="danger" />
              <StatCard title="Rate" value="90%" icon={FileText} color="warning" />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Trend</h3>
              <TrendLineChart data={MOCK_STUDENT_TREND} height={280} />
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
