import React, { useState } from 'react';
import { invitationService } from '../services/api';

const ManagementModal = ({ isOpen, onClose, event, onActionComplete }) => {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchName, setBatchName] = useState(`${event?.event_name || 'Ceremony'}-Batch-${new Date().toISOString().split('T')[0]}`);
  const [seatingStats, setSeatingStats] = useState(null);

  if (!isOpen) return null;

  const handleRunSeating = async () => {
    try {
      setIsProcessing(true);
      const result = await invitationService.assignBatchSeating(event.id);
      setSeatingStats(result);
      setStep(2); // Move to invitation step after success
    } catch (error) {
      const errorMsg = typeof error === 'object' ? (error.message || error.error || 'Failed to assign seats') : error;
      onActionComplete('error', errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateBatch = async () => {
    try {
      setIsProcessing(true);
      const result = await invitationService.generateBatch(event.id, batchName);
      onActionComplete('success', `Successfully generated ${result.total_created} invitations!`);
      onClose();
    } catch (error) {
      const errorMsg = typeof error === 'object' ? (error.message || error.error || 'Failed to generate invitations') : error;
      onActionComplete('error', errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-500">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col animate-in zoom-in-95 fade-in duration-500 overflow-hidden">
        
        {/* Modern Header */}
        <div className="p-10 pb-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-xl shadow-primary-600/20">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Ceremony Controller
                </h2>
                <p className="text-[0.7rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">
                   Mission: {event?.event_name}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              disabled={isProcessing}
              className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="px-10 mb-8">
           <div className="flex items-center space-x-4 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full bg-primary-600 transition-all duration-700 ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
           </div>
           <div className="flex justify-between mt-3">
              <span className={`text-[0.6rem] font-black uppercase tracking-widest ${step === 1 ? 'text-primary-600' : 'text-slate-400'}`}>01 Seating Intelligence</span>
              <span className={`text-[0.6rem] font-black uppercase tracking-widest ${step === 2 ? 'text-primary-600' : 'text-slate-400'}`}>02 Invitation Nexus</span>
           </div>
        </div>

        {/* Dynamic Content Body */}
        <div className="px-10 py-4 flex-1">
          {step === 1 ? (
            <div className="animate-in slide-in-from-right-8 duration-500">
               <div className="bg-primary-50 dark:bg-primary-900/10 p-8 rounded-[2rem] border border-primary-100 dark:border-primary-800/50 mb-8">
                  <h3 className="text-lg font-bold text-primary-900 dark:text-primary-100 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    GPA Priority Engine
                  </h3>
                  <p className="text-sm text-primary-700 dark:text-primary-300/80 leading-relaxed font-medium">
                    The algorithm will automatically rank all eligible graduates. Seats are assigned primarily by **Degree Level** (PhD &gt; Masters &gt; Bachelors) and secondary by **Overall GPA**.
                  </p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="card-modern p-6 bg-slate-50/50 dark:bg-slate-800/20 border-dashed border-2">
                     <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Pool</p>
                     <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Event Eligible</p>
                  </div>
                  <div className="card-modern p-6 bg-slate-50/50 dark:bg-slate-800/20 border-dashed border-2">
                     <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest mb-1">Category</p>
                     <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter text-primary-600">Graduates First</p>
                  </div>
               </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-8 duration-500">
               <div className="space-y-6">
                  <div>
                    <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Assigment Record (Batch Name)</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-600 transition-all font-bold placeholder:text-slate-300"
                      placeholder="Enter specific batch name..."
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                    />
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-start space-x-4">
                     <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800 flex flex-shrink-0 items-center justify-center text-emerald-600">
                        <svg className="w-5 h-5 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                     </div>
                     <div>
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Seating Finalized</p>
                        <p className="text-[0.7rem] text-emerald-600 dark:text-emerald-400/80 font-medium">Successfully locked {seatingStats?.assigned || 'calculated'} records via GPA ranking engine.</p>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Ultra Modern Footer */}
        <div className="p-10 pt-6">
          {step === 1 ? (
            <button 
              onClick={handleRunSeating}
              disabled={isProcessing}
              className="w-full h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:scale-100"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Running Algorithm...</span>
                </>
              ) : (
                <>
                  <span>Initialize Seating Order</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          ) : (
            <div className="flex space-x-4">
               <button 
                onClick={() => setStep(1)}
                disabled={isProcessing}
                className="w-1/3 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-[1.5rem] font-bold text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center"
               >
                 Back
               </button>
               <button 
                onClick={handleGenerateBatch}
                disabled={isProcessing}
                className="flex-1 h-16 bg-primary-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary-600/30 hover:bg-primary-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
               >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing Batch...</span>
                  </>
                ) : (
                  <>
                    <span>Execute Generation</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </>
                )}
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagementModal;
