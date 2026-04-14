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
      <div className="flex flex-col items-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Accessing Credentials</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans transition-colors duration-500">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white hidden lg:flex flex-col p-8 fixed h-full z-10">
        <div className="mb-12 flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
             <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
             </svg>
          </div>
          <h2 className="text-lg font-bold tracking-tight">Portal <span className="text-slate-400 font-medium tracking-normal">Graduate</span></h2>
        </div>

        <nav className="flex-1 space-y-2">
          <button className="w-full text-left px-5 py-3.5 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-600/25 transition-all">
            My Invitations
          </button>
          <button className="w-full text-left px-5 py-3.5 rounded-xl hover:bg-white/5 transition-all font-semibold text-slate-400 hover:text-white">
            Guest Protocol
          </button>
          <button className="w-full text-left px-5 py-3.5 rounded-xl hover:bg-white/5 transition-all font-semibold text-slate-400 hover:text-white">
            Schedule Info
          </button>
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-800">
           <button 
             onClick={handleLogout}
             className="w-full px-5 py-3.5 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-red-600 hover:text-white transition-all flex items-center justify-center space-x-2"
           >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
             <span>Sign Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-6 md:p-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Honorable <span className="text-primary-600">{user?.username}</span>
            </h1>
            <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mt-1">Class of 2026 • Individual Manifest</p>
          </div>
          <div className="flex items-center space-x-3">
             <div className="hidden sm:flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 p-2.5 pr-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">Verified Student</span>
                  <span className="text-[0.6rem] text-slate-400 font-medium uppercase tracking-[0.1em]">{user?.role}</span>
                </div>
             </div>
             <button onClick={handleLogout} className="lg:hidden p-3 bg-red-50 text-red-600 rounded-2xl transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
             </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 p-6 rounded-3xl mb-10 flex items-center space-x-4">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold text-sm tracking-tight">{error}</span>
          </div>
        )}

        {/* Invitations Grid */}
        <section className="space-y-8">
          <div className="flex items-center justify-between mb-2">
             <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Digital Credentials</h2>
             <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-[0.65rem] font-bold uppercase tracking-widest border border-primary-100">Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {invitations.length > 0 ? (
              invitations.map((inv, idx) => (
                <div key={inv.id} className="card-modern group p-0 overflow-hidden flex flex-col">
                  {/* Card Header Area */}
                  <div className="bg-slate-900 p-6 flex flex-col items-center text-center">
                     <span className={`px-2.5 py-1 rounded-lg text-[0.6rem] font-bold uppercase tracking-widest mb-4 ${
                       inv.invitation_type === 'Graduate' ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300'
                     }`}>
                       {inv.invitation_type} Clearance
                     </span>
                     <h3 className="text-white font-bold tracking-tight text-lg leading-tight mb-2">
                       {inv.invitation_type === 'Graduate' ? 'Main Commencement Pass' : `Guest Delegate Access`}
                     </h3>
                     <p className="text-slate-500 text-[0.65rem] font-medium tracking-[0.2em] font-mono">
                        #{inv.id.split('-')[0].toUpperCase()}
                     </p>
                  </div>

                  {/* QR & Detail Area */}
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="bg-slate-50 dark:bg-slate-800/50 w-full aspect-square rounded-[2rem] flex items-center justify-center border border-slate-100 dark:border-slate-800 mb-8 relative group-hover:border-primary-500/30 transition-all shadow-inner">
                      {inv.qr_code ? (
                        <img src={inv.qr_code} alt="Credential QR" className="w-3/4 h-3/4 object-contain contrast-125 dark:invert dark:brightness-200" />
                      ) : (
                        <div className="text-center p-6 space-y-3 opacity-60">
                          <svg className="w-10 h-10 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Encrypted<br/>Identity Key</p>
                        </div>
                      )}
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                       <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-center border border-slate-100 dark:border-slate-700">
                          <p className="text-[0.6rem] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Sector</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{inv.row_number || 'TBD'}</p>
                       </div>
                       <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-center border border-slate-100 dark:border-slate-700">
                          <p className="text-[0.6rem] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Position</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{inv.seat_number || 'TBD'}</p>
                       </div>
                    </div>

                    <button className="w-full btn-primary py-4 text-[0.7rem] shadow-primary-600/20 group-hover:scale-[1.02] transition-transform">
                       Secure Download (PDF)
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full card-modern border-dashed py-24 flex flex-col items-center text-center space-y-6 bg-white/50 backdrop-blur-sm">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-slate-300">
                   <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                   </svg>
                </div>
                <div>
                   <h3 className="text-slate-900 dark:text-white font-bold tracking-tight">No Active Invitations</h3>
                   <p className="text-xs text-slate-500 mt-1">Verification is still in progress for your graduation batch.</p>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs tracking-widest uppercase hover:bg-slate-800 transition-all"
                >
                   Check Status
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default GraduateDashboard;
