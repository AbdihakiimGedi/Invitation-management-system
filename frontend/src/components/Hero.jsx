import React from 'react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 py-24 md:py-32 transition-colors duration-500">
      {/* Background Shapes */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-primary-500/10 dark:bg-primary-500/5 blur-[120px] rounded-full point-events-none"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-indigo-400/10 dark:bg-primary-900/20 blur-[100px] rounded-full point-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 flex flex-col items-center text-center">
        <div className="inline-block px-5 py-2 mb-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
            The Graduation Standard
          </span>
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter leading-tight drop-shadow-sm transition-colors duration-500">
          Where Pride <br className="hidden md:block" /> Meets <span className="text-primary-600 dark:text-primary-500 italic">Precision.</span>
        </h1>
        
        <p className="text-lg md:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl leading-relaxed font-medium transition-colors duration-500">
           Manage digital invitations, seat allocations, and secure entry tracking for the 
           graduation ceremony of tomorrow. Professional. Seamless. Secure.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 w-full sm:w-auto">
          <button 
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto bg-primary-600 text-white px-10 py-4 md:px-12 md:py-5 rounded-[1.25rem] text-lg font-bold hover:bg-primary-700 transition-all duration-300 shadow-xl shadow-primary-600/20 transform hover:-translate-y-1 active:scale-95 border border-primary-500"
          >
            Launch Portal
          </button>
          <button 
            onClick={() => document.querySelector('#about').scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto bg-white dark:bg-slate-900 text-slate-800 dark:text-white px-10 py-4 md:px-12 md:py-5 rounded-[1.25rem] text-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            See How it Works
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
