import React, { useState, useEffect } from 'react';
import { eventModelService, peopleService } from '../services/api';
import ConfirmModal from './ConfirmModal';
import AlertModal from './AlertModal';
import TransferModal from './TransferModal';

const ParticipantViewerModal = ({ isOpen, onClose, event }) => {
  const [viewState, setViewState] = useState('prompt'); // 'prompt' | 'data'
  const [activeTab, setActiveTab] = useState('graduate'); // 'graduate' | 'guest'
  const [data, setData] = useState({ eligible: [], rejected: [] });
  const [loading, setLoading] = useState(false);
  
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, type: 'primary', title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'success', message: '' });

  // Transfer state
  const [transferState, setTransferState] = useState({ isOpen: false, studentId: '', studentName: '' });

  useEffect(() => {
    if (!isOpen) {
      setViewState('prompt');
      setData({ eligible: [], rejected: [] });
      setActiveTab('graduate');
    }
  }, [isOpen]);

  useEffect(() => {
    if (viewState === 'data') {
      handleAudit(activeTab);
    }
  }, [activeTab]);

  if (!isOpen || !event) return null;

  const handleAudit = async (tab = activeTab) => {
    setLoading(true);
    if (viewState !== 'data') setViewState('data');
    try {
      const [eligible, rejected] = await Promise.all([
        eventModelService.getParticipants(event.id, 'eligible', tab),
        eventModelService.getParticipants(event.id, 'rejected', tab)
      ]);
      setData({ eligible: eligible || [], rejected: rejected || [] });
    } catch (error) {
      console.error('Failed to audit participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleClose = () => {
    onClose();
  };

  const handleToggleParticipation = (studentId, studentName, currentIsParticipating, typeId) => {
    const actionLabel = currentIsParticipating ? 'Exclude' : 'Include';
    const actionType = currentIsParticipating ? 'danger' : 'primary';

    setConfirmConfig({
      isOpen: true,
      type: actionType,
      title: `${actionLabel} Participant`,
      message: `Are you sure you want to ${actionLabel.toLowerCase()} ${studentName} from this event?`,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
          await peopleService.updateParticipationStatus({
            eventId: event.id,
            userId: studentId,
            isParticipating: !currentIsParticipating,
            typeId
          });
          
          setAlertConfig({
            isOpen: true,
            type: 'success',
            message: `Success! ${studentName} has been successfully ${currentIsParticipating ? 'excluded from' : 'included in'} the event.`
          });
          
          // Refresh data to reflect changes
          handleAudit();
        } catch (error) {
          console.error('Failed to toggle participation:', error);
          setAlertConfig({
            isOpen: true,
            type: 'error',
            message: error.message || `Failed to update participation for ${studentName}.`
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const ParticipantTable = ({ participants, type }) => (
    <div className="mb-12 last:mb-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center space-x-3">
          <div className={`w-1.5 h-6 rounded-full ${type === 'eligible' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {type === 'eligible' ? 'Eligible Manifest' : 'Exclusion Registry'}
          </h3>
          <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
            {participants.length} Records
          </span>
        </div>
        <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
          {type === 'eligible' ? 'Authorized Access' : 'Criteria Dissonance'}
        </p>
      </div>

      <div className="card-modern overflow-hidden border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-8 py-4 text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Identity Details</th>
                <th className="px-8 py-4 text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  {activeTab === 'graduate' ? 'Academic Background' : 'Contact Details'}
                </th>
                <th className="px-8 py-4 text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {participants.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center space-y-2 opacity-40">
                      <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">No matching records identified</span>
                    </div>
                  </td>
                </tr>
              ) : (
                participants.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all group cursor-default">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-slate-100/80 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 font-bold text-[0.7rem] group-hover:scale-105 transition-transform">
                          {p.full_name?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white tracking-tight text-sm group-hover:text-primary-600 transition-colors uppercase">{p.full_name}</span>
                          <span className="text-[0.6rem] text-slate-400 font-bold tracking-widest uppercase">ID: {p.student_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {activeTab === 'graduate' ? (
                        <div className="flex flex-col space-y-1">
                          <span className="text-[0.8rem] font-bold text-slate-700 dark:text-slate-200 leading-none">{p.department_name || 'General Studies'}</span>
                          <div className="flex items-center space-x-1.5 opacity-60">
                             <div className="w-1 h-1 rounded-full bg-primary-500"></div>
                             <span className="text-[0.6rem] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em]">{p.faculty_name || 'N/A'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-1">
                          <span className="text-[0.8rem] font-bold text-slate-700 dark:text-slate-200 leading-none">{p.email || 'No Email'}</span>
                          <div className="flex items-center space-x-1.5 opacity-60">
                             <div className="w-1 h-1 rounded-full bg-primary-500"></div>
                             <span className="text-[0.6rem] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em]">{p.phone || 'No Phone'}</span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                       <div className="flex items-center justify-end space-x-2">
                         <button
                           onClick={() => setTransferState({ 
                             isOpen: true, 
                             studentId: p.student_id, 
                             studentName: p.full_name 
                           })}
                           className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all border border-transparent hover:border-primary-100"
                           title="Transfer to another event"
                         >
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                           </svg>
                         </button>
                         <button
                           onClick={() => handleToggleParticipation(p.student_id, p.full_name, type === 'eligible', p.type_id)}
                           className={`px-4 py-2 rounded-xl text-[0.65rem] font-bold uppercase tracking-widest transition-all border shadow-sm active:scale-95 ${
                              type === 'eligible' 
                              ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-500 hover:text-white' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white'
                           }`}
                         >
                           {type === 'eligible' ? 'Exclude' : 'Include'}
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-10 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
      <div className={`bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/20 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 ${
        viewState === 'data' ? 'w-full max-w-6xl max-h-[95vh]' : 'w-full max-w-2xl'
      }`}>
        
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <div className="flex items-center space-x-4">
             <div className="w-1.5 h-10 bg-primary-600 rounded-full"></div>
             <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                  {viewState === 'prompt' ? 'Event Audit Control' : 'Participant Manifest Oversight'}
                </h2>
                <p className="text-[0.65rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                  Registry Core: {event.event_name}
                </p>
             </div>
          </div>
          <button 
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-transparent hover:border-rose-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* View 1: Prompt Dashboard */}
        {viewState === 'prompt' && (
          <div className="p-10 text-center animate-in fade-in zoom-in-95 duration-500">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">
              Initiate a comprehensive audit of the participant registry for this ceremony sequence.
            </h3>
            
            <button
              onClick={handleAudit}
              className="group relative w-full p-10 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-500 rounded-[2.5rem] transition-all hover:shadow-2xl hover:shadow-primary-100/50 dark:hover:shadow-none hover:-translate-y-1 flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 shadow-lg shadow-primary-500/10">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Engage Audit Engine</h4>
              <p className="text-[0.7rem] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Fetch full participation manifest with criteria verification logs.
              </p>
              <div className="mt-8 flex items-center space-x-2 text-primary-600">
                 <div className="w-1 h-1 bg-primary-600 rounded-full animate-ping"></div>
                 <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em]">Synchronize Grid</span>
              </div>
            </button>
          </div>
        )}

        {/* View 2: Dual Data Manifest */}
        {viewState === 'data' && (
          <div className="flex flex-col flex-1 min-h-0 animate-in slide-in-from-right-8 duration-500">
            {/* Quick Actions / Monitor */}
            <div className="px-8 py-3.5 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-6">
                 <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-widest">{data.eligible.length} Approved</span>
                 </div>
                 <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-widest">{data.rejected.length} Excluded</span>
                 </div>
              </div>
              <button 
                onClick={() => setViewState('prompt')}
                className="group w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-primary-600 transition-all font-bold"
                title="Reset Workspace"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="px-8 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex space-x-6">
              <button
                onClick={() => handleTabChange('graduate')}
                className={`text-sm font-bold uppercase tracking-widest transition-all ${
                  activeTab === 'graduate' 
                    ? 'text-primary-600 border-b-2 border-primary-600 pb-2' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 pb-2'
                }`}
              >
                🎓 Graduates
              </button>
              <button
                onClick={() => handleTabChange('guest')}
                className={`text-sm font-bold uppercase tracking-widest transition-all ${
                  activeTab === 'guest' 
                    ? 'text-primary-600 border-b-2 border-primary-600 pb-2' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 pb-2'
                }`}
              >
                👥 Guests
              </button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar p-8">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Reconciling Manifests...</span>
                </div>
              ) : (
                <div className="max-w-screen-2xl mx-auto">
                   <ParticipantTable participants={data.eligible} type="eligible" />
                   <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full my-12 opacity-50"></div>
                   <ParticipantTable participants={data.rejected} type="rejected" />
                </div>
              )}
            </div>
            
            {/* Context Footer */}
            <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-center">
               <p className="text-[0.6rem] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em]">Internal Official Registry • Sensitive Data Protection Active</p>
            </div>
          </div>
        )}
      </div>

      {/* Global Modals */}
      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        type={confirmConfig.type}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
      />

      <AlertModal 
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <TransferModal 
        isOpen={transferState.isOpen}
        onClose={() => setTransferState(prev => ({ ...prev, isOpen: false }))}
        userId={transferState.studentId}
        studentName={transferState.studentName}
        currentEventId={event.id}
        onSuccess={() => handleAudit()}
      />
    </div>
  );
};

export default ParticipantViewerModal;
