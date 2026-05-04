import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invitationService } from '../services/api';

const GuestDashboard = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }

    const fetchInvitations = async () => {
      try {
        const data = await invitationService.getMyInvitations();
        setInvitations(data.data || []);
      } catch (err) {
        console.error('Failed to load guest invitations');
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center space-y-6">
        <div className="w-12 h-12 border-[3px] border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse italic">Synchronizing Registry...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-all duration-700 selection:bg-primary-500/30">
      {/* TOP NAVIGATION */}
      <header className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 h-24 px-8 md:px-12 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 bg-slate-900 dark:bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-primary-600/20">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
             </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
              Guest <span className="text-primary-600 italic">Access</span>
            </h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Verified Portal</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-8">
          <div className="hidden md:flex items-center space-x-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Live Session Secured</span>
          </div>
          <button 
            onClick={handleLogout}
            className="px-8 py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95 border border-rose-100 dark:border-rose-900/20"
          >
            End Protocol
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 md:p-20 max-w-5xl mx-auto w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-tight mb-4">
            Honored <span className="text-primary-600 italic">Visitor</span>
          </h2>
          <div className="flex items-center justify-center space-x-4">
            <div className="h-px w-8 bg-slate-200 dark:border-slate-800"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-relaxed">
              Credential Manifest Index: <span className="text-slate-900 dark:text-slate-200 ml-2">G-{user?.username?.substring(0, 8).toUpperCase()}</span>
            </p>
            <div className="h-px w-8 bg-slate-200 dark:border-slate-800"></div>
          </div>
        </div>

        {invitations.length > 0 ? (
          <div className="group rounded-[4rem] p-12 md:p-20 flex flex-col items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium hover:shadow-premium-hover transition-all duration-700 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary-600/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary-600/10 transition-colors duration-700"></div>
            
            {/* QR Content Area */}
            <div className="relative z-10 bg-slate-50 dark:bg-slate-950 p-12 md:p-16 rounded-[3.5rem] mb-16 w-full max-w-sm border-2 border-slate-100 dark:border-slate-800/50 flex items-center justify-center shadow-inner group-hover:border-primary-500/20 transition-all duration-700 overflow-hidden">
              <div className="absolute inset-x-0 h-[2px] bg-primary-500/20 -top-10 group-hover:animate-scanline pointer-events-none"></div>
              
              {invitations[0].qr_code ? (
                <img 
                  src={invitations[0].qr_code} 
                  alt="Guest QR Code" 
                  className="w-full contrast-125 dark:invert dark:brightness-200 group-hover:scale-105 transition-transform duration-700 ease-out" 
                />
              ) : (
                <div className="text-center text-slate-300 dark:text-slate-700 p-12 space-y-6 opacity-40">
                   <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 17h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                   </svg>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed italic">
                     Digital Key<br/>Synchronized
                   </p>
                </div>
              )}
            </div>

            {/* Allocation Grid */}
            <div className="relative z-10 grid grid-cols-2 gap-8 w-full max-w-md mb-16">
              <div className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] text-center border border-slate-100 dark:border-slate-800 transition-colors group-hover:bg-white dark:group-hover:bg-slate-800 shadow-sm">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] mb-3 italic">Sector Allocation</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">{invitations[0].row_number || 'MAIN'}</p>
              </div>
              <div className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] text-center border border-slate-100 dark:border-slate-800 transition-colors group-hover:bg-white dark:group-hover:bg-slate-800 shadow-sm">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] mb-3 italic">Grid Position</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">{invitations[0].seat_number || 'OPEN'}</p>
              </div>
            </div>

            <button className="relative z-10 w-full max-w-md py-6 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/10 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 transition-all active:scale-95 flex items-center justify-center space-x-4">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
               <span>Extract Security PDF</span>
            </button>
          </div>
        ) : (
          <div className="rounded-[4rem] border-4 border-dashed border-slate-100 dark:border-slate-800 p-24 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl animate-in zoom-in-95 duration-700">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-rose-600/5">
               <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-3">Synchronization Error</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-4 max-w-xs mx-auto leading-relaxed opacity-60 italic">
              Registry Mismatch: No active security manifest detected for this session. Please consult the administrative protocol.
            </p>
          </div>
        )}

        <div className="mt-24 text-center opacity-30">
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.5em] italic">
            Autonomous Invitation Architecture • Deployment v7.4
          </p>
        </div>
      </main>
    </div>
  );
};

export default GuestDashboard;
