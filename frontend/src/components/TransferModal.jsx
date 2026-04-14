import React, { useState, useEffect } from 'react';
import { eventModelService, peopleService } from '../services/api';
import AlertModal from './AlertModal';
import ConfirmModal from './ConfirmModal';

const TransferModal = ({ isOpen, onClose, userId, studentName, currentEventId, onSuccess }) => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  // Modal states
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'success', message: '' });

  useEffect(() => {
    if (isOpen && currentEventId) {
      fetchAvailableEvents();
    } else {
      setSelectedEventId('');
    }
  }, [isOpen, currentEventId]);

  const fetchAvailableEvents = async () => {
    setFetching(true);
    try {
      const data = await eventModelService.getAvailableTransferEvents(currentEventId);
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to fetch transfer targets:', error);
      setAlertConfig({
        isOpen: true,
        type: 'error',
        message: 'Could not synchronize available venues. Please retry.'
      });
    } finally {
      setFetching(false);
    }
  };

  const handleTransferClick = () => {
    if (!selectedEventId) return;

    const targetEvent = events.find(e => e.id === selectedEventId);
    
    setConfirmConfig({
      isOpen: true,
      title: 'Confirm Event Migration',
      message: `Are you sure you want to transfer ${studentName} to "${targetEvent?.event_name}"? This action will update the official registry.`,
      onConfirm: executeTransfer
    });
  };

  const executeTransfer = async () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    setLoading(true);
    try {
      await peopleService.transferParticipant({
        userId,
        sourceEventId: currentEventId,
        targetEventId: selectedEventId
      });

      const targetEvent = events.find(e => e.id === selectedEventId);
      setAlertConfig({
        isOpen: true,
        type: 'success',
        message: `Success! ${studentName} has been migrated to "${targetEvent?.event_name}".`
      });

      // Delay success callback to allow user to see the alert
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Transfer failed:', error);
      setAlertConfig({
        isOpen: true,
        type: 'error',
        message: error.message || 'Workflow interruption during migration.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase italic">
              Event <span className="text-primary-600">Migration</span>
            </h2>
            <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Registry Redirection Protocol</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-colors shadow-sm border border-slate-100 dark:border-slate-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor font-bold">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-10 space-y-8">
          <div className="bg-primary-50/50 dark:bg-primary-900/10 p-6 rounded-3xl border border-primary-100/50 dark:border-primary-500/10">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-primary-600 shadow-sm">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                 <span className="text-[0.6rem] font-bold text-primary-600 uppercase tracking-widest">Selected Participant</span>
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">{studentName}</h3>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Target Ceremony Sequence</label>
            <div className="relative group">
              <select 
                className="w-full bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl text-slate-900 dark:text-white font-bold outline-none border border-slate-200 dark:border-slate-800 focus:border-primary-500 appearance-none transition-all cursor-pointer"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                disabled={fetching || loading}
              >
                <option value="">Select available destination...</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.event_name} ({event.current_count}/{event.max_capacity || '∞'})
                  </option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {fetching && <p className="text-[0.6rem] font-bold text-primary-600 animate-pulse ml-2 uppercase tracking-widest">Synchronizing available venues...</p>}
          </div>

          <div className="pt-4 flex space-x-4">
            <button 
              onClick={onClose}
              className="flex-1 px-8 py-5 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold text-[0.7rem] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800"
            >
              Abort
            </button>
            <button 
              onClick={handleTransferClick}
              disabled={!selectedEventId || loading || fetching}
              className="flex-2 px-8 py-5 rounded-2xl bg-primary-600 text-white font-bold text-[0.7rem] uppercase tracking-widest hover:bg-primary-500 transition-all shadow-xl shadow-primary-600/20 disabled:opacity-50 disabled:shadow-none active:scale-95"
            >
              {loading ? 'Migrating...' : 'Authorize Transfer'}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-10 py-5 bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-[0.3em]">Query-Driven Capacity Enforcement Active</p>
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type="primary"
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
      />

      <AlertModal 
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default TransferModal;
