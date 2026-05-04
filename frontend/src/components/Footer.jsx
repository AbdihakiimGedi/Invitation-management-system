import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-slate-950 py-32 px-8 md:px-12 transition-all duration-700 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 lg:gap-32 mb-32">
          
          {/* Brand Identity */}
          <div className="col-span-1 lg:col-span-2 space-y-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-slate-900 font-black text-lg uppercase leading-none shadow-2xl">D</div>
              <div className="flex flex-col -space-y-1">
                <span className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Ceremony</span>
                <span className="text-[9px] font-black text-primary-600 uppercase tracking-[0.4em] italic">Digital.</span>
              </div>
            </div>
            <p className="max-w-sm text-lg leading-relaxed font-medium text-slate-500 dark:text-slate-400 italic">
              Elevating institutional milestones through digital orchestration. 
              Built for precision, security, and the future of management.
            </p>
          </div>

          {/* Links Protocol */}
          <div className="space-y-8">
             <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-[0.4em] text-[10px]">Resources</h4>
             <ul className="space-y-4">
                <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-xs font-black uppercase tracking-widest transition-all">Documentation</a></li>
                <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-xs font-black uppercase tracking-widest transition-all">API Gateway</a></li>
                <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-xs font-black uppercase tracking-widest transition-all">System Status</a></li>
             </ul>
          </div>

          {/* Links Institutional */}
          <div className="space-y-8">
             <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-[0.4em] text-[10px]">Institutional</h4>
             <ul className="space-y-4">
                <li><a href="#about" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-xs font-black uppercase tracking-widest transition-all">Our Vision</a></li>
                <li><a href="#contact" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-xs font-black uppercase tracking-widest transition-all">Direct Support</a></li>
                <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-xs font-black uppercase tracking-widest transition-all">Legal Protocol</a></li>
             </ul>
          </div>

        </div>

        <div className="pt-16 border-t border-slate-100 dark:border-slate-900 flex flex-col md:row justify-between items-center gap-8">
          <div className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 dark:text-slate-700 italic">
            &copy; {new Date().getFullYear()} CEREMONY DIGITAL ARCHIVE
          </div>
          <div className="flex items-center space-x-8">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600">SECURE ENCRYPTION ENABLED</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Background Glyphs */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 opacity-[0.02] dark:opacity-[0.05] pointer-events-none select-none">
        <span className="text-[20rem] font-black text-slate-900 dark:text-white leading-none tracking-tighter">DIGITAL</span>
      </div>
    </footer>
  );
};

export default Footer;
