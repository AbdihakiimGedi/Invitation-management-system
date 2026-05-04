import React from 'react';
import AdminHeader from '../components/AdminHeader';

const AdminDashboard = ({ user, setIsSidebarOpen }) => {
  const stats = [
    { label: 'Total Graduates', value: '452', change: '+12%', trend: 'up' },
    { label: 'Invitations Sent', value: '1,280', change: '+5%', trend: 'up' },
    { label: 'Current Presence', value: '92%', change: 'Real-time', trend: 'neutral' },
  ];

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-950 transition-all duration-500">
      <AdminHeader 
        title="Command Center" 
        subtitle="System Intelligence Overview" 
        setIsOpen={setIsSidebarOpen} 
        user={user} 
      />

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {stats.map((s, i) => (
          <div key={i} className="group p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium hover:shadow-premium-hover transition-all duration-500">
             <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  s.trend === 'up' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-primary-50 text-primary-600 dark:bg-primary-900/20'
                }`}>
                  {s.change}
                </div>
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">{s.label}</p>
                <h4 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {s.value}
                </h4>
             </div>
          </div>
        ))}
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-10">
         {/* Live Activity Card */}
         <div className="p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium flex flex-col h-full">
            <div className="flex justify-between items-center mb-12">
               <div className="flex items-center space-x-3">
                 <div className="w-1.5 h-6 bg-primary-600 rounded-full"></div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Recent Activity</h3>
               </div>
               <button className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:tracking-[0.2em] transition-all">Audit Logs</button>
            </div>
            
            <div className="space-y-4 flex-1">
               {[1, 2, 3, 4].map(i => (
                 <div key={i} className="group flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md">
                    <div className="flex items-center space-x-5">
                       <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-sm border border-slate-100 dark:border-slate-800 shadow-sm group-hover:rotate-6 transition-all duration-300">
                         {i % 2 === 0 ? 'GR' : 'GS'}
                       </div>
                       <div>
                          <p className="font-black text-slate-900 dark:text-slate-100 text-[13px] tracking-tight">Access Granted: Profile #{i+240}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Primary Entrance Gate</p>
                       </div>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">2m ago</span>
                 </div>
               ))}
            </div>

            <button className="w-full mt-12 py-5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-slate-900/10">
              Generate System Report
            </button>
         </div>

         {/* Monitoring Status Card */}
         <div className="p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium flex flex-col items-center justify-center text-center">
            <div className="mb-12 relative">
               <div className="absolute inset-0 bg-primary-600 blur-[60px] opacity-20 animate-pulse rounded-full"></div>
               <div className="relative z-10 w-32 h-32 rounded-[2.5rem] bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800 flex items-center justify-center">
                  <svg className="w-14 h-14 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 21.5c-2.315 0-4.498-.716-6.318-1.944M12 21.5c2.315 0 4.498-.716 6.318-1.944M12 21.5V12.75" />
                  </svg>
               </div>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-3">Gate Intelligence Active</h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-xs max-w-xs mb-12 leading-relaxed uppercase tracking-widest opacity-80">
              Real-time cryptographic validation is running on all terminals. Status: <span className="text-emerald-500 italic">Operational</span>
            </p>
            
            <button className="w-full max-w-xs py-5 rounded-2xl bg-primary-600 text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-primary-700 transition-all shadow-2xl shadow-primary-600/20 active:scale-95">
              Launch Live Monitor
            </button>
         </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
