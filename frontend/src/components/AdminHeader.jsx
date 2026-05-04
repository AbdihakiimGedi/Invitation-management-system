import React from 'react';

const AdminHeader = ({ title, subtitle, setIsOpen, user, children }) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 px-1 py-4 md:py-6">
      <div className="flex items-center space-x-6">
        {/* Mobile Toggle */}
        <button 
          onClick={() => setIsOpen(true)}
          className="lg:hidden p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 shadow-sm hover:text-primary-600 transition-all active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>

        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              {title}
            </h1>
            <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 animate-pulse"></div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Action button if provided */}
        {children && (
          <div className="hidden sm:block">
            {children}
          </div>
        )}

        {/* User Profile Summary */}
        <div className="hidden md:flex items-center space-x-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 py-2 pl-5 pr-2 rounded-[1.5rem] shadow-sm hover:border-slate-200 dark:hover:border-slate-700 transition-all group">
          <div className="flex flex-col items-end">
             <span className="text-[11px] font-black text-slate-900 dark:text-white leading-none mb-1 tracking-tight">
                {user?.username || 'Administrator'}
             </span>
             <span className="text-[9px] font-bold text-primary-600 dark:text-primary-500 uppercase tracking-widest opacity-80">
                Active Session
             </span>
          </div>
          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-sm border border-slate-100 dark:border-slate-700 group-hover:scale-105 transition-transform">
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
