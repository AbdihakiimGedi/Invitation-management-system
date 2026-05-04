import React, { useEffect, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import seatService from '../services/seatService';
import { eventModelService } from '../services/api';
import invitationService from '../services/invitationService';
import AlertModal from '../components/AlertModal';

const AssignedSeatGroups = ({ user, setIsSidebarOpen }) => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [reportingGroups, setReportingGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({ 
    isOpen: false, 
    groupId: null, 
    groupName: '', 
    participants: [], 
    loading: false 
  });
  const [invitationModal, setInvitationModal] = useState({ isOpen: false, loading: false, batches: [], qtyPerPerson: 1 });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'success', message: '' });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    let interval;
    if (selectedEventId && invitationModal.isOpen) {
      fetchBatches();
      interval = setInterval(fetchBatches, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedEventId, invitationModal.isOpen]);

  useEffect(() => {
    if (selectedEventId) {
      fetchReportData();
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const data = await eventModelService.getAll();
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to fetch events', error);
    }
  };

  const fetchReportData = async () => {
    if (!selectedEventId) return;
    try {
      setLoading(true);
      const data = await seatService.getGroupsWithAssignments(selectedEventId);
      setReportingGroups(data || []);
    } catch (error) {
      console.error('Failed to fetch reporting data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (groupId, groupName) => {
    try {
      setModalConfig({ isOpen: true, groupId, groupName, participants: [], loading: true });
      const data = await seatService.getGroupParticipants(selectedEventId, groupId);
      setModalConfig(prev => ({ ...prev, participants: data, loading: false }));
    } catch (error) {
      console.error('Failed to fetch roster', error);
      setModalConfig(prev => ({ ...prev, isOpen: false }));
    }
  };

  const fetchBatches = async () => {
    try {
      const data = await invitationService.getBatches(selectedEventId);
      setInvitationModal(prev => ({ ...prev, batches: data }));
    } catch (error) {
      console.error('Failed to fetch batches', error);
    }
  };

  const handleGenerateClick = () => {
    setInvitationModal({ ...invitationModal, isOpen: true });
    fetchBatches();
  };

  const startGeneration = async () => {
    try {
      const totalParticipants = reportingGroups.reduce((acc, g) => acc + (g.assigned_count || 0), 0);
      if (totalParticipants === 0) {
        showAlert('warning', 'No assigned participants to invite.');
        return;
      }

      setInvitationModal(prev => ({ ...prev, loading: true }));
      await invitationService.createBatch(selectedEventId, `Digital Batch ${new Date().toLocaleDateString()}`, totalParticipants, invitationModal.qtyPerPerson);
      showAlert('success', 'Invitation generation pushed to background queue.');
      setInvitationModal(prev => ({ ...prev, loading: false }));
    } catch (error) {
      showAlert('error', error.message || 'Failed to start generation');
      setInvitationModal(prev => ({ ...prev, loading: false }));
    }
  };

  const showAlert = (type, message) => {
    setAlertConfig({ isOpen: true, type, message });
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-950 transition-all duration-500">
      <AdminHeader 
        title="Deployment Analytics" 
        subtitle="Monitor Participant Distribution & Grid Rosters" 
        setIsOpen={setIsSidebarOpen} 
        user={user}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative group">
            <select 
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full sm:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-3.5 text-[13px] font-black text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all cursor-pointer appearance-none uppercase tracking-tight"
            >
              <option value="" disabled>Select Ceremony Sequence</option>
              {events.map(e => (
                <option key={e.id} value={e.id}>{e.event_name.toUpperCase()}</option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
               </svg>
            </div>
          </div>
          
          {selectedEventId && (
            <button 
              onClick={handleGenerateClick}
              className="px-8 py-3.5 bg-primary-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary-600/20 hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 8h12" />
              </svg>
              <span>Transmit Invitations</span>
            </button>
          )}
        </div>
      </AdminHeader>

      <div className="mt-12">
        {!selectedEventId ? (
          <div className="flex flex-col items-center justify-center p-24 bg-white/40 dark:bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in duration-700">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-[2rem] flex items-center justify-center mb-8 border border-slate-100 dark:border-slate-700 shadow-sm">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tighter text-center">Analytics Standby</h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-widest text-center max-w-xs leading-relaxed opacity-60 italic">Please initialize a sequence to access deployment analytics.</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-pulse">
                <div className="h-14 w-14 bg-slate-50 dark:bg-slate-800 rounded-2xl mb-8"></div>
                <div className="h-6 w-3/4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-4"></div>
                <div className="h-3 w-1/2 bg-slate-50 dark:bg-slate-800 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : reportingGroups.filter(rg => rg.assigned_count > 0).length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center">
             <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-[2.5rem] flex items-center justify-center mb-8 opacity-40">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
             </div>
             <p className="font-black uppercase tracking-[0.2em] text-[11px] text-slate-400 max-w-xs leading-relaxed italic">No active assignments detected for the selected operational sequence.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {reportingGroups.filter(rg => rg.assigned_count > 0).map(rg => (
              <div key={rg.id} className="group p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium hover:shadow-premium-hover transition-all duration-500 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-600 rounded-full blur-[50px] opacity-0 group-hover:opacity-10 transition-opacity duration-700"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-10">
                    <div className="w-14 h-14 rounded-[1.3rem] bg-slate-50 dark:bg-slate-800/50 text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="px-4 py-2 rounded-2xl bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-[0.2em] dark:bg-primary-950/30 dark:border-primary-900/30 border border-primary-100/50">
                      {rg.assigned_count} Entities
                    </span>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter uppercase line-clamp-1">{rg.name}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{rg.target_type} Operational Zone</p>
                </div>
                
                <button 
                  onClick={() => handleViewDetails(rg.id, rg.name)}
                  className="mt-12 w-full py-4.5 rounded-[1.3rem] bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 dark:hover:bg-slate-100 hover:text-white dark:hover:text-slate-900 transition-all active:scale-95 shadow-sm"
                >
                  Inspect Roster
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ROSTER DETAIL MODAL */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] dark:shadow-none flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100 dark:border-slate-800">
            <div className="p-12 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
              <div>
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-1.5 h-8 bg-primary-600 rounded-full animate-pulse"></div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{modalConfig.groupName}</h3>
                </div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] pl-6 italic">Secure Operational Zone Roster</p>
              </div>
              <button 
                onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                className="w-14 h-14 rounded-3xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 transition-all duration-500 border border-slate-100 dark:border-slate-700 active:scale-90"
              >
                <svg className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-8">
              {modalConfig.loading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-8">
                  <div className="w-16 h-16 border-[4px] border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse italic">Retrieving Grid Sequence...</span>
                </div>
              ) : modalConfig.participants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center opacity-40">
                  <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-10">
                    <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Zone Currently Devoid of Entities</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {modalConfig.participants.map(p => (
                    <div key={p.eventparticipant_id} className="group flex items-center space-x-6 p-8 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500">
                      <div className={`w-16 h-16 rounded-[1.3rem] flex-shrink-0 flex items-center justify-center text-xl font-black transition-transform duration-500 group-hover:scale-105 shadow-sm border ${p.type_name === 'Graduates' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/30' : 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/30'}`}>
                        {p.full_name ? p.full_name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h6 className="font-black text-slate-900 dark:text-slate-100 truncate text-[15px] tracking-tight uppercase">{p.full_name}</h6>
                          <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest border ${p.type_name === 'Graduates' ? 'bg-blue-50 text-blue-500 border-blue-100 dark:bg-blue-900/30 dark:border-blue-800/50' : 'bg-indigo-50 text-indigo-500 border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-800/50'}`}>
                            {p.type_name === 'Graduates' ? 'Grad' : 'Guest'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          {p.type_name === 'Graduates' ? (
                            <>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">UID: <span className="text-slate-700 dark:text-slate-300">{p.student_id}</span></span>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Metric: <span className="text-slate-700 dark:text-slate-300">{p.gpa}</span></span>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rank: <span className="text-primary-600">{p.grade}</span></span>
                            </>
                          ) : (
                            <>
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Comm: <span className="text-slate-700 dark:text-slate-300">{p.guest_phone || 'N/A'}</span></span>
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Registry: <span className="text-slate-700 dark:text-slate-300 italic lowercase">@{p.guest_email?.split('@')[0] || 'none'}</span></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-10 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-8">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] italic pr-8 border-r border-slate-200 dark:border-slate-800">Operational Ceremony Audit Log</p>
              <button 
                onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                className="px-10 py-4.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm"
              >
                Terminate Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVITATION TRANSMISSION MODAL */}
      {invitationModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100 dark:border-slate-800">
            <div className="p-12 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">Communication Gateway</h3>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic pl-1">Invitation Protocol Management</p>
              </div>
              <button onClick={() => setInvitationModal({ ...invitationModal, isOpen: false })} className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-[1.2rem] text-slate-400 hover:text-rose-600 transition-all active:scale-90 border border-slate-100 dark:border-slate-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-12 space-y-10">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-6 pl-1">Entitlement Metric (Invitations / Entity)</label>
                <div className="flex items-center space-x-6">
                  <input 
                    type="number" 
                    min="1" 
                    max="5"
                    value={invitationModal.qtyPerPerson}
                    onChange={(e) => setInvitationModal({ ...invitationModal, qtyPerPerson: parseInt(e.target.value) || 1 })}
                    className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-4 text-2xl font-black text-center outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-sans text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] font-bold text-slate-500 italic max-w-xs leading-relaxed opacity-80">Define the quantity of cryptographic invitations allocated to each validated participant for family admission.</p>
                </div>
              </div>

              {invitationModal.batches.length === 0 ? (
                <div className="text-center py-16 opacity-30">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-slate-300">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.3em]">No Transmission Batches Detected</p>
                </div>
              ) : (
                <div className="space-y-6 max-h-[35vh] overflow-y-auto pr-6 custom-scrollbar">
                  {invitationModal.batches.map(batch => (
                    <div key={batch.id} className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h5 className="font-black text-slate-900 dark:text-white tracking-tighter uppercase text-[15px]">{batch.batch_name}</h5>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{new Date(batch.created_at).toLocaleString().toUpperCase()}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                          batch.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          batch.status === 'Failed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-primary-50 text-primary-600 border-primary-100 animate-pulse'
                        }`}>
                          {batch.status}
                        </span>
                      </div>
                      <div className="h-3 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                        <div 
                          className="h-full bg-primary-600 transition-all duration-1000 shadow-[0_0_20px_rgba(37,99,235,0.4)]" 
                          style={{ width: `${(batch.processed_count / (batch.total_count || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-4">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{batch.processed_count} <span className="mx-1 opacity-30">/</span> {batch.total_count} ENTITIES COMMITTED</span>
                        {batch.status === 'Failed' && <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Protocol Breach: {batch.error_message}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-10 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                onClick={startGeneration}
                disabled={invitationModal.loading || (invitationModal.batches[0]?.status === 'Pending' || invitationModal.batches[0]?.status === 'Processing')}
                className="px-12 py-5 bg-primary-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary-600/20 hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {invitationModal.loading ? 'Queueing Sequence...' : 'Initialize Transmission'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal 
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
      />
    </div>
  );
};

export default AssignedSeatGroups;
