import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Search, Filter, RotateCcw, RefreshCw } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { getAttendanceHistory } from '../services/attendanceApi';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const PER_PAGE = 15;
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const row = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } };

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(studentSearch, 300);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await getAttendanceHistory({
        page,
        per_page: PER_PAGE,
        date: dateFilter || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: debouncedSearch || undefined
      });
      const data = res?.data || res;
      setRecords(data?.records || []);
      setTotal(data?.total || 0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, dateFilter, statusFilter, debouncedSearch]);

  const totalPages = Math.ceil(total / PER_PAGE);

  const resetFilters = () => {
    setDateFilter('');
    setStudentSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Attendance Records</h2>
          <p className="text-slate-500 text-sm mt-0.5">{total} verified institutional logs</p>
        </div>
        <button 
          onClick={fetchRecords} 
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input 
          type="date" 
          value={dateFilter} 
          onChange={e => { setDateFilter(e.target.value); setPage(1); }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500 shadow-sm" 
        />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={studentSearch} 
            onChange={e => { setStudentSearch(e.target.value); setPage(1); }} 
            placeholder="Search student or ID..."
            className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500 shadow-sm w-56" 
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
        >
          <option value="all">All Status</option>
          <option value="Present">Present</option>
          <option value="Late">Late</option>
          <option value="Absent">Absent</option>
        </select>
        <button 
          onClick={resetFilters} 
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors px-3 py-2"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">IN Time</th>
                <th className="px-6 py-4">OUT Time</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Biometric Confidence</th>
              </tr>
            </thead>
            <motion.tbody 
              variants={container} 
              initial="hidden" 
              animate="show" 
              key={`${page}-${statusFilter}-${dateFilter}`} 
              className="divide-y divide-slate-50 dark:divide-slate-700/50"
            >
              {records.map(r => (
                <motion.tr key={r.id} variants={row} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{r.student_name || r.name}</p>
                    <p className="text-xs font-mono text-slate-400">{r.student_id}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs">{r.date}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs">{r.check_in_time || <span className="text-slate-300">—</span>}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs">{r.check_out_time || <span className="text-slate-300">—</span>}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs">
                    {r.duration_minutes ? `${r.duration_minutes} mins` : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={r.status || 'Present'} /></td>
                  <td className="px-6 py-4">
                    {r.confidence > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${r.confidence >= 0.85 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                            style={{ width: `${Math.min(r.confidence * 100, 100)}%` }} 
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {Math.round(r.confidence * 100)}%
                        </span>
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
        
        {!loading && records.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary-500" />
            <p className="font-medium text-sm">No attendance records found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                Prev
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
