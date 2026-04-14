import React from 'react';
import AdminHeader from '../components/AdminHeader';

const AdminDashboard = ({ user, setIsSidebarOpen }) => {
  const stats = [
    { label: 'Graduates', value: '452', change: '+12%', trend: 'up' },
    { label: 'Invitations', value: '1,280', change: '+5%', trend: 'up' },
    { label: 'Presence', value: '92%', change: 'Today', trend: 'neutral' },
  ];

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-950 transition-all duration-500">
      <AdminHeader 
        title="Dashboard" 
        subtitle="Operational Overview" 
        setIsOpen={setIsSidebarOpen} 
        user={user} 
      />

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((s, i) => (
          <div key={i} className="card-modern p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
             <div className="flex justify-between items-start mb-4">
                <span className="text-[0.65rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-0.5">
                  {s.label}
                </span>
                <div className={`px-2.5 py-1 rounded-lg text-[0.65rem] font-bold ${
                  s.trend === 'up' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-primary-50 text-primary-600 dark:bg-primary-900/20'
                }`}>
                  {s.change}
                </div>
             </div>
             <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {s.value}
                </span>
             </div>
          </div>
        ))}
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
         {/* Live Activity Card */}
         <div className="card-modern p-10 flex flex-col h-full bg-white/50 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Recent Activity</h3>
               <button className="text-xs font-semibold text-primary-600 hover:underline">View All</button>
            </div>
            
            <div className="space-y-4 flex-1">
               {[1, 2, 3, 4].map(i => (
                 <div key={i} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800">
                    <div className="flex items-center space-x-4">
                       <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold text-xs uppercase">
                         {i % 2 === 0 ? 'G' : 'V'}
                       </div>
                       <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Graduate Profile {i}</p>
                          <p className="text-[0.65rem] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">B.Sc Information Technology</p>
                       </div>
                    </div>
                    <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">2m ago</span>
                 </div>
               ))}
            </div>

            <button className="w-full mt-10 btn-secondary py-5 text-sm">
              Generate Detailed Report
            </button>
         </div>

         {/* Monitoring Status Card */}
         <div className="card-modern p-10 flex flex-col items-center justify-center text-center bg-white">
            <div className="mb-10 inline-flex p-8 rounded-[3rem] bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800">
               <div className="relative">
                  <div className="absolute inset-0 bg-primary-500 blur-2xl opacity-20 animate-pulse"></div>
                  <svg className="w-16 h-16 text-primary-600 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
               </div>
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Gate Intelligence</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-xs mb-10 leading-relaxed">
              Real-time monitoring is active across all entry points. Currently processing incoming QR validations.
            </p>
            
            <button className="btn-primary w-full py-5 text-sm shadow-xl shadow-primary-600/20">
              Open Gate Monitor
            </button>
         </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
