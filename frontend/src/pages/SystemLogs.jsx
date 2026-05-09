import React, { useEffect, useState } from 'react';
import { 
  Search, Filter, Clock, User, Activity, AlertCircle, 
  ChevronLeft, ChevronRight, RefreshCw, Download
} from 'lucide-react';
import AdminHeader from '../components/AdminHeader';
import { logService } from '../services/api';

const ActionBadge = ({ type }) => {
  const styles = {
    USER_LOGIN: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400',
    EVENT_CREATED: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
    EVENT_UPDATED: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
    INVITATION_RESENT: 'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400',
    ATTENDANCE_SCANNED: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400',
    USER_PASSWORD_RESET: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
    DEFAULT: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${styles[type] || styles.DEFAULT}`}>
      {type?.replace(/_/g, ' ')}
    </span>
  );
};

const SystemLogs = ({ user, setIsSidebarOpen }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await logService.getLogs({
        search,
        limit,
        offset: page * limit
      });
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      setError(err.message || 'Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, search]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminHeader 
        title="System Logs" 
        subtitle="Track and audit all administrative actions across the platform" 
        setIsOpen={setIsSidebarOpen} 
        user={user} 
      />

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search logs by action or description..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-600/20 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={loadLogs}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-primary-600 transition-all shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg">
            <Download size={16} />
            <span>Export Logs</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-sm font-bold flex items-center space-x-3">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actor</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Type</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {loading && logs.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="4" className="px-8 py-6"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <Activity className="text-slate-200 dark:text-slate-800 mb-4" size={48} />
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching logs found</p>
                    </div>
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-3">
                      <Clock size={14} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-[10px]">
                        {log.actor_name?.[0] || 'S'}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white">{log.actor_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{log.actor_role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <ActionBadge type={log.action_type} />
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 max-w-md line-clamp-1">
                      {log.description}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400">
              Showing <span className="text-slate-900 dark:text-white">{page * limit + 1}</span> to <span className="text-slate-900 dark:text-white">{Math.min((page + 1) * limit, total)}</span> of <span className="text-slate-900 dark:text-white">{total}</span> logs
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 disabled:opacity-50 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum = page;
                if (totalPages > 5) {
                  if (page < 3) pageNum = i;
                  else if (page > totalPages - 3) pageNum = totalPages - 5 + i;
                  else pageNum = page - 2 + i;
                } else {
                   pageNum = i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                      page === pageNum 
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
                        : 'border border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 disabled:opacity-50 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs;
