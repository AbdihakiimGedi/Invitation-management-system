import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, type = 'primary', title, message }) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl transition-all duration-500 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-none border border-slate-100 dark:border-slate-800 p-10 text-center animate-in zoom-in-95 duration-500">
        
        {/* Icon Container */}
        <div className={`w-20 h-20 mx-auto mb-8 rounded-[2.5rem] flex items-center justify-center shadow-sm border transition-all duration-500 ${
          isDanger 
            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-100/50 dark:border-rose-800/50 shadow-rose-500/5' 
            : 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 border-primary-100/50 dark:border-primary-800/50 shadow-primary-500/5'
        }`}>
          {isDanger ? (
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ) : (
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Text Content */}
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter uppercase">
          {title || (isDanger ? 'Verification' : 'Confirmation')}
        </h3>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-10 px-4 text-balance opacity-80">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl ${
              isDanger 
                ? 'bg-rose-600 text-white shadow-rose-600/20 hover:bg-rose-700' 
                : 'bg-primary-600 text-white shadow-primary-600/20 hover:bg-primary-700'
            }`}
          >
            {isDanger ? 'Execute Action' : 'Confirm & Proceed'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 rounded-xl text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 dark:hover:text-slate-200 transition-all"
          >
            Cancel Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
