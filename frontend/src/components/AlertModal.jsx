import React from 'react';

const AlertModal = ({ isOpen, onClose, type = 'success', message, buttonText }) => {
  if (!isOpen) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl transition-all duration-500 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-none border border-slate-100 dark:border-slate-800 p-10 text-center animate-in zoom-in-95 duration-500">
        
        {/* Icon Container */}
        <div className={`w-20 h-20 mx-auto mb-8 rounded-[2.5rem] flex items-center justify-center shadow-sm border transition-all duration-500 ${
          isSuccess 
            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-100/50 dark:border-emerald-800/50 shadow-emerald-500/5' 
            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-100/50 dark:border-rose-800/50 shadow-rose-500/5'
        }`}>
          {isSuccess ? (
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>

        {/* Text Content */}
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter uppercase">
          {isSuccess ? 'Success' : 'Attention'}
        </h3>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-10 px-4 whitespace-pre-line opacity-80">
          {message}
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl ${
            isSuccess 
              ? 'bg-primary-600 text-white shadow-primary-600/20 hover:bg-primary-700' 
              : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90'
          }`}
        >
          {buttonText || (isSuccess ? 'Continue' : 'Acknowledge')}
        </button>
      </div>
    </div>
  );
};

export default AlertModal;
