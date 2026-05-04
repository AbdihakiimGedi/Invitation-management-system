import React, { useState } from 'react';
import invitationService from '../services/invitationService';

const InvitationScanner = () => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { success, message, invitation }
  const [error, setError] = useState(null);

  const handleScan = async (e) => {
    e?.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = await invitationService.verifyInvitation(token);
      setResult(data);
      setToken(''); // Clear for next scan
    } catch (err) {
      setError(err.response?.data || { message: 'Invalid or network error' });
      setResult({ success: false, message: err.response?.data?.message || 'Invalid' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 sm:p-10 font-sans selection:bg-primary-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-2xl text-center mb-16 relative z-10 animate-in fade-in slide-in-from-top-8 duration-1000">
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-4 bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent uppercase leading-none">
          Entry Terminal
        </h1>
        <div className="flex items-center justify-center space-x-4">
           <div className="h-px w-12 bg-gradient-to-r from-transparent to-slate-700"></div>
           <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] sm:text-xs">Access Validation Protocol</p>
           <div className="h-px w-12 bg-gradient-to-l from-transparent to-slate-700"></div>
        </div>
      </div>

      <div className="w-full max-w-lg space-y-10 relative z-10 animate-in fade-in zoom-in-95 duration-700">
        {/* INPUT SECTION */}
        <form onSubmit={handleScan} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-[3rem] blur opacity-20 group-focus-within:opacity-40 transition-opacity duration-500"></div>
          <div className="relative">
            <input 
              autoFocus
              type="text" 
              placeholder="SCAN AUTHENTICATION TOKEN"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-900/80 backdrop-blur-xl border-2 border-slate-800 rounded-[3rem] px-10 py-8 text-2xl font-black text-center placeholder:text-slate-700 focus:border-primary-500/50 focus:ring-0 transition-all outline-none uppercase tracking-[0.2em] shadow-2xl shadow-black/50"
            />
            <div className="absolute inset-y-4 right-4">
              <button 
                type="submit"
                disabled={loading || !token}
                className="h-full px-10 bg-primary-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-500 active:scale-95 transition-all disabled:opacity-0 shadow-lg shadow-primary-600/20"
              >
                Execute
              </button>
            </div>
          </div>
        </form>

        {/* RESULT DISPLAY */}
        <div className="min-h-[420px] relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-md z-20 rounded-[4rem] border-2 border-slate-800/50">
              <div className="relative">
                <div className="w-24 h-24 border-[6px] border-primary-900/30 border-t-primary-600 rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-[6px] border-indigo-900/30 border-b-indigo-600 rounded-full animate-spin-slow"></div>
              </div>
              <span className="mt-10 text-[10px] font-black uppercase tracking-[0.5em] text-primary-500 animate-pulse italic">Decrypting Registry...</span>
            </div>
          )}

          {result && (
            <div className={`p-12 rounded-[4rem] border-2 transition-all duration-700 shadow-2xl overflow-hidden relative ${
              result.success 
                ? 'bg-emerald-950/10 border-emerald-500/30 shadow-emerald-500/5' 
                : 'bg-rose-950/10 border-rose-500/30 shadow-rose-500/5'
            }`}>
              {/* Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/5 to-transparent h-20 -top-20 animate-scanline"></div>

              {result.success ? (
                <div className="text-center animate-in zoom-in-95 duration-500">
                  <div className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-[0_20px_50px_rgba(16,185,129,0.3)] border-4 border-emerald-400/50">
                    <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 text-emerald-400">Validated</h2>
                  <p className="text-emerald-500/40 font-black text-[9px] uppercase tracking-[0.4em] mb-10 italic">Access Clearance Confirmed</p>
                  
                  <div className="space-y-4 text-left">
                    <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Subject Identity</p>
                      <p className="text-2xl font-black truncate tracking-tight">{result.invitation?.full_name?.toUpperCase()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-primary-600/10 backdrop-blur-md p-8 rounded-[2rem] border border-primary-500/20">
                        <p className="text-[9px] font-black text-primary-500/60 uppercase tracking-widest mb-2">Operational Zone</p>
                        <p className="text-2xl font-black tracking-tight">{result.invitation?.group_name?.toUpperCase()}</p>
                      </div>
                      <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Subject Class</p>
                        <p className="text-2xl font-black text-indigo-400 tracking-tight">{result.invitation?.type_name?.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center animate-in shake-200 duration-500">
                  <div className="w-28 h-28 bg-gradient-to-br from-rose-400 to-rose-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-[0_20px_50px_rgba(244,63,94,0.3)] border-4 border-rose-400/50">
                    <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 text-rose-400">Rejected</h2>
                  <p className="text-rose-500/40 font-black text-[9px] uppercase tracking-[0.4em] mb-10 italic">{result.message?.toUpperCase()}</p>
                  
                  <div className="bg-rose-500/5 backdrop-blur-md p-10 rounded-[2.5rem] border border-rose-500/20 text-center">
                     <p className="text-rose-400 text-xs font-black uppercase tracking-[0.2em] leading-relaxed">
                       {result.error === 'ALREADY_USED' 
                         ? 'Security Violation: Credential Already Committed to Registry.' 
                         : 'Protocol Breach: Unauthorized or Invalid Security Token.'}
                     </p>
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => setResult(null)}
                className="mt-10 w-full py-5 rounded-[1.5rem] bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-[10px] font-black uppercase tracking-[0.4em] active:scale-95"
              >
                Flush Terminal
              </button>
            </div>
          )}

          {!result && !loading && (
             <div className="h-full flex flex-col items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity duration-1000">
                <div className="relative">
                  <svg className="w-40 h-40 mb-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 8h12" />
                  </svg>
                  <div className="absolute inset-0 bg-primary-500/20 blur-[60px] rounded-full"></div>
                </div>
                <p className="font-black uppercase tracking-[1em] text-center text-[10px] pl-4">Awaiting Signal</p>
             </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-16 text-[9px] font-black text-slate-800 uppercase tracking-[0.5em] flex items-center space-x-4 relative z-10">
         <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]"></span>
         <span className="opacity-50 italic">Encrypted Secure Uplink Active</span>
      </div>
    </div>
  );
};

export default InvitationScanner;
