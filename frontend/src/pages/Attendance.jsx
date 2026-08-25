import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardList, Search, Filter, RotateCcw, RefreshCw, 
  GraduationCap, Users, UserCheck, Clock, ShieldCheck, Fingerprint
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { getAttendanceHistory } from '../services/attendanceApi';
import { useDebounce } from '../hooks/useDebounce';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

const PER_PAGE = 15;
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const row = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } };

export default function Attendance() {
  const { user } = useApp();
  const isPrincipal = user?.role === 'principal';

  // Strict Segregation: 'student' or 'teacher'
  const [personTypeTab, setPersonTypeTab] = useState('student');
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState('');
  const [personSearch, setPersonSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(personSearch, 300);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const activeType = isPrincipal ? personTypeTab : 'student';
      const res = await getAttendanceHistory({
        page,
        per_page: PER_PAGE,
        date: dateFilter || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: debouncedSearch || undefined,
        person_type: activeType
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
  }, [page, dateFilter, statusFilter, debouncedSearch, personTypeTab]);

  const totalPages = Math.ceil(total / PER_PAGE);

  const resetFilters = () => {
    setDateFilter('');
    setPersonSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
              Attendance Records
            </h1>
            <span className="bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-primary-200 dark:border-primary-800/50">
              {total} Verified Logs
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {isPrincipal 
              ? 'Institutional attendance registry segregated by Faculty & Students' 
              : 'Classroom student attendance registry'}
          </p>
        </div>

        <button 
          onClick={fetchRecords} 
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Role Segregation Tabs for Principal */}
      {isPrincipal && (
        <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1 w-fit border border-slate-200/60 dark:border-slate-700">
          <button
            onClick={() => { setPersonTypeTab('student'); setPage(1); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              personTypeTab === 'student'
                ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-primary-500" />
            <span>Student Attendance</span>
          </button>
          
          <button
            onClick={() => { setPersonTypeTab('teacher'); setPage(1); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              personTypeTab === 'teacher'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-500" />
            <span>Faculty / Teacher Attendance</span>
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <input 
          type="date" 
          value={dateFilter} 
          onChange={e => { setDateFilter(e.target.value); setPage(1); }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500 shadow-sm" 
        />
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={personSearch} 
            onChange={e => { setPersonSearch(e.target.value); setPage(1); }} 
            placeholder={personTypeTab === 'teacher' ? 'Search teacher name or ID...' : 'Search student name or ID...'}
            className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500 shadow-sm w-60" 
          />
        </div>

        <select 
          value={statusFilter} 
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
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

      {/* Segregated Records Table */}
      <div className="bg-white dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 text-[11px] font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">{personTypeTab === 'teacher' ? 'Faculty Member' : 'Student'}</th>
                <th className="px-6 py-4">Role Designation</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">IN Time</th>
                <th className="px-6 py-4">OUT Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Biometric Confidence</th>
              </tr>
            </thead>
            <motion.tbody 
              variants={container} 
              initial="hidden" 
              animate="show" 
              key={`${page}-${statusFilter}-${dateFilter}-${personTypeTab}`} 
              className="divide-y divide-slate-100/60 dark:divide-slate-700/60"
            >
              {records.map(r => (
                <motion.tr key={r.id} variants={row} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      {r.student_name || r.name}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400">{r.student_id}</p>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      (r.person_type === 'teacher' || strStartsWith(r.student_id, 'TCH'))
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                    }`}>
                      {(r.person_type === 'teacher' || strStartsWith(r.student_id, 'TCH')) ? '👨‍🏫 Teacher' : '🎓 Student'}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs font-mono">{r.date}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs font-mono">
                    {r.check_in_time || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs font-mono">
                    {r.check_out_time || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={r.status || 'Present'} /></td>
                  <td className="px-6 py-4">
                    {r.confidence > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${r.confidence >= 0.85 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                            style={{ width: `${Math.min(r.confidence * 100, 100)}%` }} 
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
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
            <p className="font-semibold text-xs">
              No {personTypeTab === 'teacher' ? 'Faculty' : 'Student'} attendance records found
            </p>
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

function strStartsWith(str, prefix) {
  return String(str || '').startsWith(prefix);
}
