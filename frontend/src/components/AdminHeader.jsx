import React from 'react';

const AdminHeader = ({ title, subtitle, setIsOpen, user, children }) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-1 py-4 md:py-6">
      <div className="flex items-center space-x-4">
        {/* Mobile Toggle */}
        <button 
          onClick={() => setIsOpen(true)}
          className="lg:hidden p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 shadow-sm hover:text-primary-600 transition-all"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>

        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2"></div>
          </div>
          <p className="text-[0.65rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
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
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 py-1.5 pl-4 pr-1.5 rounded-2xl shadow-sm hover:border-slate-200 dark:hover:border-slate-700 transition-all">
          <div className="flex flex-col items-end mr-1">
             <span className="text-[0.7rem] font-bold text-slate-900 dark:text-white leading-none mb-0.5">
                {user?.username || 'Administrator'}
             </span>
             <span className="text-[0.55rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                System Ops
             </span>
          </div>
          <div className="w-9 h-9 bg-primary-600 rounded-[0.9rem] flex items-center justify-center text-white font-bold text-xs shadow-md shadow-primary-600/20">
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
