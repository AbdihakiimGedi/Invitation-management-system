import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, type = 'primary', title, message }) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-center animate-in zoom-in-95 duration-300">
        
        {/* Icon Container */}
        <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-sm border transition-colors ${
          isDanger 
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-100 dark:border-red-800' 
            : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 border-primary-100 dark:border-primary-800'
        }`}>
          {isDanger ? (
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ) : (
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Text Content */}
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
          {title || (isDanger ? 'Critical Action' : 'Are you sure?')}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8 px-2 text-balance">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-sm bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg ${
              isDanger 
                ? 'bg-red-600 text-white shadow-red-600/25 hover:bg-red-700' 
                : 'bg-primary-600 text-white shadow-primary-600/25 hover:bg-primary-700'
            }`}
          >
            {isDanger ? 'Confirm' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
