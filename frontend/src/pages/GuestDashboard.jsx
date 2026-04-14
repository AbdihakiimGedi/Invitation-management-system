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
      <div className="flex flex-col items-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verifying Access</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-500">
      {/* Top Bar */}
      <header className="bg-white dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 h-20 px-8 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-600/20">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
             </svg>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Guest <span className="text-slate-400 font-medium">Entrance</span>
          </h1>
        </div>
        
        <div className="flex items-center space-x-6">
          <span className="hidden sm:inline-block text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
             Public Session
          </span>
          <button 
            onClick={handleLogout}
            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
          >
            End Session
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome, <span className="text-primary-600">Visitor</span>
          </h2>
          <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center justify-center space-x-2">
            <span>Access Authorization</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span className="text-primary-600">Ref: G-{user?.username?.substring(0, 8).toUpperCase()}</span>
          </p>
        </div>

        {invitations.length > 0 ? (
          <div className="card-modern p-10 md:p-16 flex flex-col items-center bg-white/80 dark:bg-slate-900 shadow-2xl">
            {/* QR Content Area */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-10 rounded-[2.5rem] mb-12 w-full max-w-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-inner relative group">
              {invitations[0].qr_code ? (
                <img 
                  src={invitations[0].qr_code} 
                  alt="Guest QR Code" 
                  className="w-full contrast-125 dark:invert dark:brightness-125 group-hover:scale-105 transition-transform duration-500" 
                />
              ) : (
                <div className="text-center text-slate-300 dark:text-slate-600 p-10 space-y-4">
                   <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 17h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                   </svg>
                   <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] leading-relaxed">
                     Credential<br/>Manifested
                   </p>
                </div>
              )}
            </div>

            {/* Allocation Grid */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-12">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center border border-slate-100 dark:border-slate-700">
                <p className="text-[0.6rem] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Designated Row</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{invitations[0].row_number || 'Main'}</p>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center border border-slate-100 dark:border-slate-700">
                <p className="text-[0.6rem] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Seat Position</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{invitations[0].seat_number || 'General'}</p>
              </div>
            </div>

            <button className="w-full max-w-md btn-primary py-5 text-sm shadow-primary-600/25 active:scale-[0.98] transition-all">
              Download Guest Manifest (PDF)
            </button>
          </div>
        ) : (
          <div className="card-modern border-dashed p-20 text-center bg-white/50 backdrop-blur-sm">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
            </div>
            <h3 className="text-slate-900 dark:text-white font-bold tracking-tight">Registry Mismatch</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              We could not locate an active invitation for this session. Please verify your credentials with the event administrator.
            </p>
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-slate-400 text-[0.6rem] font-bold uppercase tracking-[0.25em]">
            Digital Ceremony Management System • v1.0
          </p>
        </div>
      </main>
    </div>
  );
};

export default GuestDashboard;
