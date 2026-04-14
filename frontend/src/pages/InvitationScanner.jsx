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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 sm:p-10 font-sans">
      <div className="w-full max-w-2xl text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-4 bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent uppercase">Entry Terminal</h1>
        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs sm:text-sm">Official Ceremonial Access Validation</p>
      </div>

      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
        {/* INPUT SECTION */}
        <form onSubmit={handleScan} className="relative group">
          <input 
            autoFocus
            type="text" 
            placeholder="PASTE TOKEN OR SCAN QR"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={loading}
            className="w-full bg-slate-900/50 border-4 border-slate-800 rounded-[2.5rem] px-8 py-6 text-xl font-black text-center placeholder:text-slate-700 focus:border-primary-500 focus:ring-0 transition-all outline-none uppercase tracking-widest shadow-2xl shadow-primary-500/5"
          />
          <button 
            type="submit"
            disabled={loading || !token}
            className="absolute right-3 top-3 bottom-3 px-8 bg-primary-600 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-primary-500 active:scale-95 transition-all disabled:opacity-0"
          >
            Verify
          </button>
        </form>

        {/* RESULT DISPLAY */}
        <div className="min-h-[350px] relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10 rounded-[3rem]">
              <div className="w-20 h-20 border-8 border-primary-900 border-t-primary-500 rounded-full animate-spin mb-6"></div>
              <span className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">Checking Credentials...</span>
            </div>
          )}

          {result && (
            <div className={`p-10 rounded-[3rem] border-4 transition-all duration-500 shadow-2xl ${
              result.success 
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-emerald-500/10' 
                : 'bg-rose-950/20 border-rose-500/40 shadow-rose-500/10'
            }`}>
              {result.success ? (
                <div className="text-center animate-in zoom-in-95 fill-mode-forwards">
                  <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/30">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tight mb-2 text-emerald-400">Validated</h2>
                  <p className="text-emerald-500/60 font-black text-[0.65rem] uppercase tracking-widest mb-8">Access Granted to Ceremony</p>
                  
                  <div className="space-y-4 text-left">
                    <div className="bg-white/5 p-6 rounded-2xl">
                      <p className="text-[0.6rem] font-bold text-slate-500 uppercase mb-1">Participant Name</p>
                      <p className="text-lg font-black truncate">{result.invitation?.full_name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-6 rounded-2xl border-l-4 border-primary-500">
                        <p className="text-[0.6rem] font-bold text-slate-500 uppercase mb-1">Seating Zone</p>
                        <p className="text-lg font-black">{result.invitation?.group_name}</p>
                      </div>
                      <div className="bg-white/5 p-6 rounded-2xl">
                        <p className="text-[0.6rem] font-bold text-slate-500 uppercase mb-1">Type</p>
                        <p className="text-lg font-black text-indigo-400">{result.invitation?.type_name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center animate-in shake-in duration-500">
                  <div className="w-24 h-24 bg-rose-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-rose-500/30">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tight mb-2 text-rose-400">Rejected</h2>
                  <p className="text-rose-500/60 font-black text-[0.65rem] uppercase tracking-widest mb-8">{result.message}</p>
                  
                  {result.error === 'ALREADY_USED' && (
                    <div className="bg-rose-500/10 p-6 rounded-2xl border-2 border-rose-500/20 text-left">
                       <p className="text-rose-400 text-sm font-bold text-center">Security Alert: This ticket has already entered the venue.</p>
                    </div>
                  )}
                </div>
              )}
              
              <button 
                onClick={() => setResult(null)}
                className="mt-8 w-full py-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-[0.65rem] font-black uppercase tracking-[0.2em]"
              >
                Reset Scanner
              </button>
            </div>
          )}

          {!result && !loading && (
             <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-20">
                <svg className="w-32 h-32 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 8h12" />
                </svg>
                <p className="font-black uppercase tracking-[0.5em] text-center">Waiting for Input...</p>
             </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-10 text-[0.6rem] font-bold text-slate-800 uppercase tracking-[0.3em] flex items-center space-x-2">
         <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
         <span>System Secure & Encrypted</span>
      </div>
    </div>
  );
};

export default InvitationScanner;
