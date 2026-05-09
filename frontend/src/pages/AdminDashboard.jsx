import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Users, Calendar, Mail, CheckCircle, Clock, AlertCircle, 
  TrendingUp, TrendingDown, Award, Star, Activity, ArrowRight
} from 'lucide-react';
import AdminHeader from '../components/AdminHeader';
import { dashboardService } from '../services/api';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ label, value, icon: Icon, trend, trendValue, accent = 'indigo' }) => {
  const accentColors = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400',
  };

  return (
    <div className="group p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-4 rounded-2xl ${accentColors[accent]} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            trend === 'up' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'
          }`}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl shadow-2xl">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center space-x-3 py-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-sm font-black text-white">{entry.name}:</span>
            <span className="text-sm font-bold text-slate-300">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const AdminDashboard = ({ user, setIsSidebarOpen }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const overview = await dashboardService.getOverview();
        if (isMounted) setData(overview);
      } catch (err) {
        if (isMounted) setError(err.message || 'Could not load dashboard data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 300000); // Refresh every 5 mins
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const metrics = data?.metrics || {};
  const analytics = data?.analytics || {};
  const summary = data?.summary || {};

  const typeDistributionData = useMemo(() => 
    (analytics.participant_type_distribution || []).map(item => ({
      name: item.type_name,
      value: parseInt(item.count)
    })), [analytics.participant_type_distribution]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Initializing Dashboard</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminHeader 
        title="Admin Command Center" 
        subtitle="Real-time system intelligence and event analytics" 
        setIsOpen={setIsSidebarOpen} 
        user={user} 
      />

      {error && (
        <div className="mb-8 p-6 rounded-[2rem] bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center space-x-4 text-rose-700 dark:text-rose-400">
          <AlertCircle size={24} />
          <p className="font-bold">{error}</p>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-10">
        <StatCard label="Active Events" value={metrics.active_events} icon={Calendar} accent="indigo" />
        <StatCard label="Total Graduates" value={metrics.graduates} icon={Award} accent="emerald" />
        <StatCard label="Total Guests" value={metrics.guests} icon={Users} accent="amber" />
        <StatCard label="VIP Guests" value={metrics.vip_guests} icon={Star} accent="violet" />
        <StatCard label="Attended" value={metrics.total_attended} icon={CheckCircle} accent="emerald" />
        <StatCard label="Finished Events" value={metrics.finished_events} icon={Clock} accent="rose" />
      </section>

      {/* Main Charts Section */}
      <div className="grid xl:grid-cols-[1fr_400px] gap-8 mb-10">
        {/* Comparison Chart */}
        <div className="p-8 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black tracking-tight mb-1">Invitation vs Attendance</h2>
              <p className="text-xs font-bold text-slate-400">Comparing expected vs actual turnout per event</p>
            </div>
            <div className="flex items-center space-x-4">
               <div className="flex items-center space-x-2">
                 <div className="w-3 h-3 rounded-full bg-primary-600"></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase">Invitations</span>
               </div>
               <div className="flex items-center space-x-2">
                 <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase">Attended</span>
               </div>
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.attendance_per_event}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f033" />
                <XAxis 
                  dataKey="event_name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar 
                  dataKey="invitations" 
                  name="Invitations" 
                  fill="#4f46e5" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                />
                <Bar 
                  dataKey="attended" 
                  name="Attended" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="p-8 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium">
          <h2 className="text-xl font-black tracking-tight mb-8">Participant Mix</h2>
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeDistributionData}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {typeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black">{metrics.total_participants}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            {typeDistributionData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-tighter">{item.name}</span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary and Trends Section */}
      <div className="grid xl:grid-cols-3 gap-8">
        {/* Trends */}
        <div className="xl:col-span-2 p-8 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium">
          <h2 className="text-xl font-black tracking-tight mb-8">Event Participant Load</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.event_participant_counts}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f033" />
                <XAxis 
                  dataKey="event_name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="participant_count" 
                  name="Participants"
                  stroke="#4f46e5" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Summary */}
        <div className="p-8 rounded-[3rem] bg-indigo-600 text-white shadow-premium relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-700">
             <Activity size={160} />
          </div>
          <h2 className="text-xl font-black tracking-tight mb-8 relative z-10">System Summary</h2>
          <div className="space-y-6 relative z-10">
            <div className="p-5 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-1">Most Attended Event</p>
              <h4 className="text-lg font-black">{summary.highest_attended_event || 'N/A'}</h4>
              <p className="text-xs font-bold text-indigo-200 mt-1">{summary.highest_count || 0} participants recorded</p>
            </div>
            
            <div className="p-5 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-1">Total Invitations Sent</p>
              <h4 className="text-lg font-black">{metrics.total_invitations_sent?.toLocaleString() || 0}</h4>
              <p className="text-xs font-bold text-indigo-200 mt-1">Across all registered events</p>
            </div>

            <div className="flex items-center justify-between p-5 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-1">Attendance Rate</p>
                <h4 className="text-3xl font-black">{metrics.attendance_rate || 0}%</h4>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center">
                 <div className="w-10 h-10 rounded-full border-4 border-white border-t-transparent animate-spin-slow"></div>
              </div>
            </div>

            <button className="w-full flex items-center justify-center space-x-3 py-4 rounded-2xl bg-white text-indigo-600 font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg">
              <span>Generate Full Report</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
