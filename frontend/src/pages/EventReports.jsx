import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Calendar, Users, Mail, CheckCircle, Clock, Award, Star, 
  TrendingUp, ArrowLeft, Download, Printer, Filter, Search,
  ChevronDown, UserCheck, UserMinus, Percent
} from 'lucide-react';
import AdminHeader from '../components/AdminHeader';
import { reportService } from '../services/api';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const ReportStat = ({ label, value, icon: Icon, color = 'indigo' }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30',
  };
  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center space-x-5">
      <div className={`p-4 rounded-2xl ${colors[color]}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h4>
      </div>
    </div>
  );
};

const EventReports = ({ user, setIsSidebarOpen }) => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoadingList(true);
        const data = await reportService.getEvents();
        setEvents(data);
      } catch (err) {
        setError('Failed to load events list');
      } finally {
        setLoadingList(false);
      }
    };
    loadEvents();
  }, []);

  const handleSelectEvent = async (eventId) => {
    try {
      setLoading(true);
      setError('');
      setSelectedEventId(eventId);
      const data = await reportService.getEventReport(eventId);
      setReport(data);
    } catch (err) {
      setError('Failed to generate report for this event');
    } finally {
      setLoading(false);
    }
  };

  const participantData = useMemo(() => 
    (report?.participant_breakdown || []).map(item => ({
      name: item.type_name,
      value: parseInt(item.count)
    })), [report?.participant_breakdown]);

  if (loadingList) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Report Engine</p>
      </div>
    );
  }

  if (!selectedEventId || !report) {
    return (
      <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-950">
        <AdminHeader title="Event Reports" subtitle="Detailed analytics and attendance insights" setIsOpen={setIsSidebarOpen} user={user} />
        
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight">Select an Event</h2>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400">
                <Search size={18} />
              </div>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {events.length === 0 ? (
                <div className="py-20 text-center">
                  <Calendar className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={64} />
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No events found in database</p>
                </div>
              ) : events.map(event => (
                <button
                  key={event.id}
                  onClick={() => handleSelectEvent(event.id)}
                  className="w-full flex items-center justify-between p-6 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group"
                >
                  <div className="flex items-center space-x-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      event.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                    }`}>
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">{event.event_name}</h3>
                      <p className="text-xs font-bold text-slate-400 mt-0.5">{new Date(event.event_date).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      event.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                    }`}>
                      {event.status}
                    </span>
                    <ChevronDown size={20} className="text-slate-300 group-hover:text-primary-600 transition-all -rotate-90" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => { setSelectedEventId(null); setReport(null); }}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-primary-600 shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{report.summary.name}</h1>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center">
               <Calendar size={14} className="mr-2" />
               {new Date(report.summary.date).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Printer size={16} />
            <span>Print Report</span>
          </button>
          <button className="flex items-center space-x-2 px-6 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg">
            <Download size={16} />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-10 p-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-fit shadow-sm">
        {['summary', 'attendance', 'invitations', 'lists'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
             <ReportStat label="Max Capacity" value={report.summary.capacity || 'Unlimited'} icon={Users} color="indigo" />
             <ReportStat label="Total Invitations" value={report.summary.total_invitations} icon={Mail} color="amber" />
             <ReportStat label="Attended Count" value={report.summary.total_attended} icon={UserCheck} color="emerald" />
             <ReportStat label="Remaining Space" value={report.summary.remaining_capacity} icon={Users} color="rose" />
           </section>

           <div className="grid lg:grid-cols-2 gap-8">
             <div className="p-8 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium">
               <h3 className="text-lg font-black mb-8">Participant Breakdown</h3>
               <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={participantData}
                       innerRadius={60}
                       outerRadius={90}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {participantData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                       ))}
                     </Pie>
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
               <div className="grid grid-cols-2 gap-4 mt-4">
                 {participantData.map((item, index) => (
                   <div key={item.name} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                     <div className="flex items-center space-x-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{item.name}</span>
                     </div>
                     <span className="text-sm font-black">{item.value}</span>
                   </div>
                 ))}
               </div>
             </div>

             <div className="p-8 rounded-[3rem] bg-indigo-600 text-white shadow-premium flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-black mb-2">Overall Performance</h3>
                  <p className="text-xs font-bold text-indigo-100 uppercase tracking-widest">Attendance vs Invitations</p>
                </div>
                <div className="py-12 flex flex-col items-center">
                   <div className="relative w-40 h-40">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle className="text-indigo-800 stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                        <circle className="text-white stroke-current" strokeWidth="8" strokeDasharray={`${report.attendance_analysis.percentage * 2.51} 251`} strokeLinecap="round" fill="transparent" r="40" cx="50" cy="50" transform="rotate(-90 50 50)" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black">{report.attendance_analysis.percentage}%</span>
                      </div>
                   </div>
                </div>
                <div className="p-6 rounded-[2rem] bg-white/10 backdrop-blur-sm border border-white/10 flex justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-indigo-200">Expected</p>
                    <p className="text-lg font-black">{report.attendance_analysis.attended + report.attendance_analysis.absent}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-indigo-200">Actual</p>
                    <p className="text-lg font-black">{report.attendance_analysis.attended}</p>
                  </div>
                </div>
             </div>
           </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="grid lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1 p-8 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium">
               <h3 className="text-lg font-black mb-8">Status Distribution</h3>
               <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={[
                         { name: 'Attended', value: report.attendance_analysis.attended },
                         { name: 'Absent', value: report.attendance_analysis.absent }
                       ]}
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={10}
                       dataKey="value"
                     >
                       <Cell fill="#10b981" cornerRadius={10} />
                       <Cell fill="#ef4444" cornerRadius={10} />
                     </Pie>
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
               <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20">
                   <div className="flex items-center space-x-3">
                     <UserCheck size={16} className="text-emerald-600" />
                     <span className="text-xs font-black uppercase tracking-tighter text-emerald-700">Attended</span>
                   </div>
                   <span className="text-sm font-black text-emerald-800 dark:text-emerald-300">{report.attendance_analysis.attended}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20">
                   <div className="flex items-center space-x-3">
                     <UserMinus size={16} className="text-rose-600" />
                     <span className="text-xs font-black uppercase tracking-tighter text-rose-700">Absent</span>
                   </div>
                   <span className="text-sm font-black text-rose-800 dark:text-rose-300">{report.attendance_analysis.absent}</span>
                 </div>
               </div>
             </div>

             <div className="lg:col-span-2 p-8 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium flex flex-col">
                <h3 className="text-lg font-black mb-8 text-center uppercase tracking-widest text-slate-400">Section 3: Attendance Analysis</h3>
                <div className="flex-1 flex flex-col items-center justify-center">
                   <div className="w-full max-w-lg space-y-12">
                      <div>
                        <div className="flex justify-between mb-4">
                          <span className="text-sm font-black uppercase tracking-widest">Attended</span>
                          <span className="text-sm font-black">{report.attendance_analysis.percentage}%</span>
                        </div>
                        <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${report.attendance_analysis.percentage}%` }}></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-12 text-center">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Total Expected</p>
                          <p className="text-4xl font-black text-slate-900 dark:text-white">{report.attendance_analysis.attended + report.attendance_analysis.absent}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Total Attended</p>
                          <p className="text-4xl font-black text-emerald-500">{report.attendance_analysis.attended}</p>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
           </div>
        </div>
      )}

      {activeTab === 'invitations' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="grid lg:grid-cols-2 gap-8">
             <div className="p-8 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium">
               <h3 className="text-lg font-black mb-8">Invitation Funnel</h3>
               <div className="space-y-6">
                 <div className="relative pt-6">
                   <div className="flex justify-between mb-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Sent</span>
                     <span className="text-sm font-black">{report.invitation_analysis.sent}</span>
                   </div>
                   <div className="h-10 bg-indigo-500 rounded-2xl w-full"></div>
                 </div>
                 <div className="relative px-8">
                   <div className="flex justify-between mb-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Requests</span>
                     <span className="text-sm font-black">{report.invitation_analysis.pending}</span>
                   </div>
                   <div className="h-10 bg-amber-400 rounded-2xl w-full opacity-60"></div>
                 </div>
                 <div className="relative px-16">
                   <div className="flex justify-between mb-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rejected</span>
                     <span className="text-sm font-black">{report.invitation_analysis.rejected}</span>
                   </div>
                   <div className="h-10 bg-rose-400 rounded-2xl w-full opacity-40"></div>
                 </div>
               </div>
             </div>

             <div className="p-8 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium flex items-center justify-center">
                <div className="text-center">
                   <div className="w-32 h-32 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 mb-6 mx-auto">
                      <Mail size={48} />
                   </div>
                   <h3 className="text-2xl font-black mb-2">{report.invitation_analysis.sent}</h3>
                   <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Invitations Issued</p>
                </div>
             </div>
           </div>
        </div>
      )}

      {activeTab === 'lists' && (
        <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden">
             <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
               <div className="flex items-center space-x-3 text-emerald-500">
                 <UserCheck size={20} />
                 <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Attended List</h3>
               </div>
               <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">{report.lists.attended.length}</span>
             </div>
             <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/30 sticky top-0">
                    <tr>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {report.lists.attended.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="px-8 py-4 text-xs font-black text-slate-900 dark:text-white">{item.name}</td>
                        <td className="px-8 py-4"><span className="text-[10px] font-black uppercase text-slate-400">{item.type}</span></td>
                        <td className="px-8 py-4 text-xs font-bold text-slate-500">{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
           </div>

           <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden">
             <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
               <div className="flex items-center space-x-3 text-rose-500">
                 <UserMinus size={20} />
                 <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Absent List</h3>
               </div>
               <span className="text-xs font-black px-3 py-1 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/30">{report.lists.absent.length}</span>
             </div>
             <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/30 sticky top-0">
                    <tr>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {report.lists.absent.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="px-8 py-4 text-xs font-black text-slate-900 dark:text-white">{item.name}</td>
                        <td className="px-8 py-4"><span className="text-[10px] font-black uppercase text-slate-400">{item.type}</span></td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default EventReports;
