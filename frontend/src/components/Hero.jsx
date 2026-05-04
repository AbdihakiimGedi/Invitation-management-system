import React from 'react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-slate-950 pt-20 transition-all duration-700 selection:bg-primary-500/30">
      {/* Immersive Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-primary-600/5 dark:bg-primary-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        {/* Fine grid pattern for premium feel */}
        <div className="absolute inset-0 bg-grid-slate-900/[0.02] dark:bg-grid-slate-100/[0.02] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-8 md:px-12 relative z-10 w-full">
        <div className="flex flex-col items-center text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-3 px-6 py-2.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
              The Graduation Excellence Protocol
            </span>
          </div>
          
          {/* Main Headline */}
          <div className="max-w-5xl mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black text-slate-900 dark:text-white tracking-tighter leading-[0.85] uppercase">
              Elevate <br /> 
              <span className="text-primary-600 italic">Legacy.</span>
            </h1>
            <div className="flex items-center justify-center space-x-6 mt-8">
               <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-800"></div>
               <p className="text-slate-400 dark:text-slate-500 font-black italic uppercase tracking-[0.5em] text-xs md:text-sm">Precision Engineered Orchestration</p>
               <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-800"></div>
            </div>
          </div>
          
          {/* Narrative */}
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed font-medium mb-16 animate-in fade-in duration-1000" style={{ animationDelay: '0.4s' }}>
            The definitive architecture for high-stakes institutional ceremonies. 
            Seamlessly coordinate thousands with cryptographically secure 
            authentication and real-time operational oversight.
          </p>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 w-full sm:w-auto mb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000" style={{ animationDelay: '0.6s' }}>
            <button 
              onClick={() => navigate('/login')}
              className="group w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-12 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/20 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 dark:hover:text-white transition-all duration-500 active:scale-95 flex items-center justify-center space-x-4"
            >
              <span>Initialize Portal</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <button 
              onClick={() => document.querySelector('#about').scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-12 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all duration-500 flex items-center justify-center group"
            >
              Explore Protocol
              <span className="ml-3 w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 group-hover:bg-primary-500 transition-colors"></span>
            </button>
          </div>

          {/* Real-time Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-20 opacity-30 dark:opacity-20 animate-in fade-in duration-1000" style={{ animationDelay: '1s' }}>
             <div className="flex flex-col items-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">10K+</span>
                <span className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-500 mt-2">Validated</span>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">99.9%</span>
                <span className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-500 mt-2">Accuracy</span>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">0.4s</span>
                <span className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-500 mt-2">Latency</span>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">SSL+</span>
                <span className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-500 mt-2">Encrypted</span>
             </div>
          </div>
        </div>
      </div>
      
      {/* Decorative side text */}
      <div className="absolute right-10 bottom-20 vertical-text hidden lg:block opacity-10 pointer-events-none">
        <span className="text-[10px] font-black uppercase tracking-[1em] text-slate-900 dark:text-white leading-none whitespace-nowrap">MISSION CRITICAL SYSTEMS / CORE 9.2</span>
      </div>
    </section>
  );
};

export default Hero;
