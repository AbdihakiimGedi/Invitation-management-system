import React from 'react';

const AlertModal = ({ isOpen, onClose, type = 'success', message, buttonText }) => {
  if (!isOpen) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-center animate-in zoom-in-95 duration-300">
        
        {/* Icon Container */}
        <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-sm border transition-colors ${
          isSuccess 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-100 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-100 dark:border-red-800'
        }`}>
          {isSuccess ? (
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>

        {/* Text Content */}
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
          {isSuccess ? 'Import Result' : 'Attention'}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8 px-2 whitespace-pre-line">
          {message}
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className={`w-full py-3.5 rounded-xl font-bold transition-all active:scale-95 shadow-lg ${
            isSuccess 
              ? 'bg-primary-600 text-white shadow-primary-600/25 hover:bg-primary-700' 
              : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90'
          }`}
        >
          {buttonText || (isSuccess ? 'OK' : 'Dismiss')}
        </button>
      </div>
    </div>
  );
};

export default AlertModal;
