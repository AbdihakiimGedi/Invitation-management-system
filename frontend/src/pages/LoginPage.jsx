import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authService.login(username, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate(data.redirect_path || '/');
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        (typeof err === 'string' ? err : 'Authentication failed. Please check your credentials.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden transition-all duration-700 selection:bg-primary-500/30">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] right-[-15%] w-[60%] h-[60%] bg-primary-600/5 dark:bg-primary-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] left-[-15%] w-[60%] h-[60%] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        {/* Header Section */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] shadow-premium mb-8 group hover:scale-110 transition-all duration-500">
            <span className="text-primary-600 text-3xl font-black group-hover:rotate-12 transition-transform">D</span>
          </Link>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter uppercase leading-none">Authentication</h1>
          <div className="flex items-center justify-center space-x-3 mt-2">
            <div className="h-px w-6 bg-slate-200 dark:bg-slate-800"></div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] italic">Ceremony Secure Gateway</p>
            <div className="h-px w-6 bg-slate-200 dark:bg-slate-800"></div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white dark:border-slate-800 rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-12 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          <form onSubmit={handleLogin} className="space-y-8 relative z-10">
            {error && (
              <div className="p-5 bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-2xl animate-in shake-in duration-500 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                {error}
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-2 italic">
                Subject Username
              </label>
              <div className="relative group/input">
                <input
                  type="text"
                  className="w-full px-6 py-5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-[1.3rem] outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all dark:text-white font-black text-[13px] placeholder:text-slate-300 dark:placeholder:text-slate-700 tracking-tight"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="IDENTIFIER"
                  required
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200 dark:text-slate-800 group-focus-within/input:text-primary-500/30 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-2 italic">
                Secure Protocol Key
              </label>
              <div className="relative group/input">
                <input
                  type="password"
                  className="w-full px-6 py-5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-[1.3rem] outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all dark:text-white font-black text-[13px] placeholder:text-slate-300 dark:placeholder:text-slate-700 tracking-[0.4em]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200 dark:text-slate-800 group-focus-within/input:text-primary-500/30 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-6 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/10 active:scale-[0.97] hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 dark:hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[72px]"
            >
              {loading ? (
                <div className="flex items-center space-x-4">
                  <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="animate-pulse">Authorizing...</span>
                </div>
              ) : (
                'Initialize Session'
              )}
            </button>
          </form>
        </div>

        {/* Footer Area */}
        <div className="mt-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000" style={{ animationDelay: '0.5s' }}>
           <button 
             onClick={() => navigate('/')}
             className="px-8 py-4 rounded-xl text-[10px] font-black text-slate-400 hover:text-primary-600 dark:hover:text-primary-500 transition-all uppercase tracking-[0.3em] flex items-center justify-center mx-auto space-x-3 active:scale-95"
           >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
             </svg>
             <span>Return to Registry</span>
           </button>
           
           <p className="mt-12 text-[9px] font-black text-slate-300 dark:text-slate-800 uppercase tracking-[0.6em] italic">
             Secure Uplink v9.2.1
           </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
