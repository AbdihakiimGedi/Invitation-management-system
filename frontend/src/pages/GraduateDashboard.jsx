import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invitationService } from '../services/api';

const GraduateDashboard = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const fetchInvitations = async () => {
      try {
        const data = await invitationService.getMyInvitations();
        setInvitations(data || []);
      } catch (err) {
        setError('Failed to load invitations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-[3px] border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-[3px] border-slate-200 dark:border-slate-800 border-b-primary-400 rounded-full animate-spin-slow"></div>
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse italic">Authenticating Academic Profile...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans transition-all duration-700">
      {/* SIDEBAR */}
      <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 hidden lg:flex flex-col p-10 fixed h-full z-20">
        <div className="mb-16">
          <div className="flex items-center space-x-4 mb-10">
            <div className="w-12 h-12 bg-slate-900 dark:bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/10 dark:shadow-primary-600/20">
               <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l9-5-9-5-9 5 9 5z" />
               </svg>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">Portal</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Graduate Access</p>
            </div>
          </div>

          <nav className="space-y-3">
            <button className="w-full text-left px-6 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 dark:shadow-none transition-all flex items-center justify-between group">
              <span>Invitations</span>
              <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></div>
            </button>
            <button className="w-full text-left px-6 py-4 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all">
              Ceremony Guide
            </button>
            <button className="w-full text-left px-6 py-4 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all">
              Security Protocol
            </button>
          </nav>
        </div>

        <div className="mt-auto pt-10 border-t border-slate-50 dark:border-slate-800/50">
           <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 mb-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic text-center">Batch Status</p>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[100%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              </div>
              <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-2 text-center">Verified for Graduation</p>
           </div>
           
           <button 
             onClick={handleLogout}
             className="w-full px-6 py-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center space-x-3 border border-rose-100 dark:border-rose-900/20 active:scale-95"
           >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
             <span>Terminate</span>
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:ml-80 p-8 md:p-14">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8 relative z-10 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-tight">
              Welcome Back, <span className="text-primary-600 italic">{user?.username}</span>
            </h1>
            <div className="flex items-center space-x-3 mt-3">
              <span className="px-3 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg shadow-lg">Class of 2026</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] italic pr-3 border-r border-slate-200 dark:border-slate-800">Academic Merit Registry</span>
              <span className="text-[9px] font-black text-primary-600 uppercase tracking-[0.3em] animate-pulse">Session Active</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="hidden sm:flex items-center space-x-5 bg-white dark:bg-slate-900 p-3 pr-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-premium">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary-600/20">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight uppercase">{user?.username}</span>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic">{user?.role} Profile</p>
                </div>
             </div>
             <button onClick={handleLogout} className="lg:hidden p-4 bg-white dark:bg-slate-900 text-rose-500 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-premium active:scale-90 transition-all">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
             </button>
          </div>
        </header>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-100 dark:border-rose-900/30 text-rose-600 p-8 rounded-[2.5rem] mb-12 flex items-center space-x-6 animate-in slide-in-from-left-4 duration-500">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-black text-xs uppercase tracking-widest">{error}</span>
          </div>
        )}

        {/* INVITATIONS GRID */}
        <section className="space-y-12 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800/50">
             <div className="flex items-center space-x-4">
               <div className="w-2 h-8 bg-primary-600 rounded-full"></div>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Digital Credentials</h2>
             </div>
             <div className="flex items-center space-x-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Verified Registry</span>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
            {invitations.length > 0 ? (
              invitations.map((inv, idx) => (
                <div key={inv.id} className="group p-0 rounded-[3.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium hover:shadow-premium-hover transition-all duration-500 flex flex-col overflow-hidden">
                  {/* Card Header Area */}
                  <div className="bg-slate-900 dark:bg-slate-800/50 p-10 flex flex-col items-center text-center relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-b from-primary-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                     <span className={`relative z-10 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] mb-6 border ${
                       inv.invitation_type === 'Graduate' ? 'bg-primary-600 text-white border-primary-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                     }`}>
                       {inv.invitation_type} Clearance
                     </span>
                     <h3 className="relative z-10 text-white font-black tracking-tighter text-2xl uppercase leading-tight mb-3 group-hover:scale-105 transition-transform duration-500">
                       {inv.invitation_type === 'Graduate' ? 'Main Commencement' : `Guest Access`}
                     </h3>
                     <p className="relative z-10 text-slate-500 text-[10px] font-black tracking-[0.4em] italic uppercase">
                        Protocol: {inv.id.split('-')[0].toUpperCase()}
                     </p>
                  </div>

                  {/* QR & Detail Area */}
                  <div className="p-10 flex-1 flex flex-col items-center">
                    <div className="bg-slate-50 dark:bg-slate-950/50 w-full aspect-square rounded-[3rem] flex items-center justify-center border-2 border-slate-100 dark:border-slate-800/50 mb-10 relative group-hover:border-primary-500/20 transition-all shadow-inner overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                      {inv.qr_code ? (
                        <img src={inv.qr_code} alt="Credential QR" className="w-2/3 h-2/3 object-contain contrast-125 dark:invert dark:brightness-200 group-hover:scale-110 transition-transform duration-700 ease-out" />
                      ) : (
                        <div className="text-center p-10 space-y-4 opacity-40 group-hover:opacity-60 transition-opacity">
                          <svg className="w-14 h-14 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] leading-relaxed">Encrypted<br/>Identity Manifest</p>
                        </div>
                      )}
                      
                      {/* Decorative scanline */}
                      <div className="absolute inset-x-0 h-[2px] bg-primary-500/30 -top-10 group-hover:animate-scanline pointer-events-none"></div>
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-6 w-full mb-10">
                       <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2rem] text-center border border-slate-100 dark:border-slate-800 transition-colors group-hover:bg-white dark:group-hover:bg-slate-800 shadow-sm">
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-2 italic">Sector</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{inv.row_number || 'TBD'}</p>
                       </div>
                       <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2rem] text-center border border-slate-100 dark:border-slate-800 transition-colors group-hover:bg-white dark:group-hover:bg-slate-800 shadow-sm">
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-2 italic">Position</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{inv.seat_number || 'TBD'}</p>
                       </div>
                    </div>

                    <button className="w-full py-5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 transition-all active:scale-95 flex items-center justify-center space-x-3">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                       </svg>
                       <span>Extract PDF Manifest</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-32 flex flex-col items-center text-center space-y-10 animate-in fade-in duration-1000">
                <div className="relative">
                  <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-[3rem] flex items-center justify-center text-slate-300 dark:text-slate-600 shadow-inner">
                     <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                     </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full border-4 border-slate-50 dark:border-slate-950 animate-bounce"></div>
                </div>
                <div>
                   <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-3">Credentials Pending</h3>
                   <p className="text-xs text-slate-500 font-bold max-w-sm mx-auto leading-relaxed uppercase tracking-widest opacity-60">Verification sequence is currently executing for your graduation cohort. Please standby for synchronization.</p>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-12 py-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-[10px] tracking-[0.3em] uppercase hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all active:scale-95 shadow-lg"
                >
                   Check Synchrony
                </button>
              </div>
            )}
          </div>
        </section>

        {/* FOOTER METRICS */}
        <footer className="mt-24 pt-12 border-t border-slate-200 dark:border-slate-800/50 text-center opacity-40">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] italic">
             Academic Credential Management Architecture • v4.0.2
           </p>
        </footer>
      </main>
    </div>
  );
};

export default GraduateDashboard;
