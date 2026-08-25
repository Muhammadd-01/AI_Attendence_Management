import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Search, Filter, RotateCcw } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

// ── Mock Data ──────────────────────────────────────────────────
const MOCK_RECORDS = [
  { id: 1, student_id: 'ST001', name: 'Muhammad Affan', date: '2026-08-25', check_in: '08:12 AM', check_out: '09:45 AM', duration: '1h 33m', status: 'Present', confidence: 0.96 },
  { id: 2, student_id: 'ST002', name: 'Ali Hassan', date: '2026-08-25', check_in: '08:15 AM', check_out: '09:50 AM', duration: '1h 35m', status: 'Present', confidence: 0.94 },
  { id: 3, student_id: 'ST003', name: 'Ahmed Khan', date: '2026-08-25', check_in: '08:22 AM', check_out: null, duration: null, status: 'Late', confidence: 0.91 },
  { id: 4, student_id: 'ST004', name: 'Sara Ahmed', date: '2026-08-25', check_in: '08:05 AM', check_out: '09:55 AM', duration: '1h 50m', status: 'Present', confidence: 0.97 },
  { id: 5, student_id: 'ST005', name: 'Fatima Zahra', date: '2026-08-25', check_in: '08:18 AM', check_out: null, duration: null, status: 'Present', confidence: 0.93 },
  { id: 6, student_id: 'ST006', name: 'Usman Ali', date: '2026-08-25', check_in: '08:30 AM', check_out: null, duration: null, status: 'Late', confidence: 0.89 },
  { id: 7, student_id: 'ST007', name: 'Zainab Malik', date: '2026-08-25', check_in: null, check_out: null, duration: null, status: 'Absent', confidence: 0 },
  { id: 8, student_id: 'ST008', name: 'Ibrahim Qureshi', date: '2026-08-25', check_in: null, check_out: null, duration: null, status: 'Absent', confidence: 0 },
  { id: 9, student_id: 'ST001', name: 'Muhammad Affan', date: '2026-08-24', check_in: '08:10 AM', check_out: '09:40 AM', duration: '1h 30m', status: 'Present', confidence: 0.95 },
  { id: 10, student_id: 'ST002', name: 'Ali Hassan', date: '2026-08-24', check_in: '08:20 AM', check_out: '09:55 AM', duration: '1h 35m', status: 'Late', confidence: 0.92 },
  { id: 11, student_id: 'ST003', name: 'Ahmed Khan', date: '2026-08-24', check_in: null, check_out: null, duration: null, status: 'Absent', confidence: 0 },
  { id: 12, student_id: 'ST004', name: 'Sara Ahmed', date: '2026-08-24', check_in: '08:02 AM', check_out: '09:50 AM', duration: '1h 48m', status: 'Present', confidence: 0.98 },
];
// ────────────────────────────────────────────────────────────────

const PER_PAGE = 8;
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const row = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } };

export default function Attendance() {
  const [dateFilter, setDateFilter] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return MOCK_RECORDS.filter(r => {
      if (dateFilter && r.date !== dateFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (studentSearch) {
        const q = studentSearch.toLowerCase();
        if (!r.name.toLowerCase().includes(q) && !r.student_id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [dateFilter, studentSearch, statusFilter, classFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const resetFilters = () => { setDateFilter(''); setStudentSearch(''); setStatusFilter('all'); setClassFilter('all'); setPage(1); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Attendance History</h2>
        <p className="text-gray-500 mt-1">{filtered.length} records</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setPage(1); }} placeholder="Search student..."
            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none transition w-48" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition">
          <option value="all">All Status</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Late">Late</option>
        </select>
        <button onClick={resetFilters} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors px-3 py-2.5">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50/50">
                <th className="px-6 py-4 font-medium">Student</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">IN Time</th>
                <th className="px-6 py-4 font-medium">OUT Time</th>
                <th className="px-6 py-4 font-medium">Duration</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Confidence</th>
              </tr>
            </thead>
            <motion.tbody variants={container} initial="hidden" animate="show" key={`${page}-${statusFilter}-${dateFilter}`} className="divide-y divide-gray-50">
              {paginated.map(r => (
                <motion.tr key={r.id} variants={row} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.student_id}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{r.date}</td>
                  <td className="px-6 py-4 text-gray-600">{r.check_in || <span className="text-gray-300">—</span>}</td>
                  <td className="px-6 py-4 text-gray-600">{r.check_out || <span className="text-gray-300">—</span>}</td>
                  <td className="px-6 py-4 text-gray-600">{r.duration || <span className="text-gray-300">—</span>}</td>
                  <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                  <td className="px-6 py-4">
                    {r.confidence > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${r.confidence >= 0.9 ? 'bg-success' : 'bg-warning'}`} style={{ width: `${r.confidence * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-500">{(r.confidence * 100).toFixed(0)}%</span>
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
        {paginated.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No attendance records found</p>
          </div>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
