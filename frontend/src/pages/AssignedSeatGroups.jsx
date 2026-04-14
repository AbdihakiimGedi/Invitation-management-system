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
        title="Assigned Seat Groups" 
        subtitle="Monitor participant distribution and zone rosters" 
        setIsOpen={setIsSidebarOpen} 
        user={user}
      >
        <div className="flex items-center space-x-4">
          <select 
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-white dark:bg-slate-900 border-2 border-primary-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all cursor-pointer"
          >
            <option value="" disabled>--- Select Graduation Event ---</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.event_name}</option>
            ))}
          </select>
          {selectedEventId && (
            <button 
              onClick={handleGenerateClick}
              className="flex items-center space-x-3 px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 8h12" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20H4v-3M7 4H4v3m13 0h3V4h-3m0 16h3v-3M8 8h3v3H8V8zm5 0h3v3h-3V8zm0 5h3v3h-3v-3zM8 13h3v3H8v-3z" />
              </svg>
              <span>Generate & Send Invitations</span>
            </button>
          )}
        </div>
      </AdminHeader>

      <div className="mt-10">
        {!selectedEventId ? (
          <div className="flex flex-col items-center justify-center p-20 bg-white/50 dark:bg-slate-900/50 rounded-[3rem] border-4 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in duration-700">
            <div className="w-24 h-24 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-primary-500/10">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">Select an Event</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-center max-w-sm">Choose an event from the dropdown above to view the assigned seat groups and distributionHeadcounts.</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card-modern p-8 bg-white/50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 animate-pulse">
                <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl mb-6"></div>
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg mb-4"></div>
                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : reportingGroups.filter(rg => rg.assigned_count > 0).length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in duration-700">
             <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-3xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
             </div>
             <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">No Active Assignments</h3>
             <p className="text-slate-500 dark:text-slate-400 font-medium text-center max-w-xs">There are no participants assigned to any seat groups for this event yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {reportingGroups.filter(rg => rg.assigned_count > 0).map(rg => (
              <div key={rg.id} className="card-modern p-8 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 hover:border-primary-500/30 transition-all flex flex-col justify-between group shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-primary-600/10">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 transition-all duration-500 flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 text-xs font-black uppercase tracking-widest ring-1 ring-primary-100 dark:ring-primary-900/50">
                      {rg.assigned_count} Assigned
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight line-clamp-1">{rg.name}</h4>
                  <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">{rg.target_type} Zone</p>
                </div>
                
                <button 
                  onClick={() => handleViewDetails(rg.id, rg.name)}
                  className="mt-8 w-full py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-primary-600 hover:text-white transition-all transform hover:-translate-y-1 active:scale-95 shadow-sm"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}></div>
          
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl shadow-primary-900/20 flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="px-3 py-1 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-black uppercase tracking-wider">Zone Roster</span>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{modalConfig.groupName}</h3>
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Reviewing all individuals successfully assigned to this ceremonial sector.</p>
              </div>
              <button 
                onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                className="p-4 rounded-[1.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:rotate-90 transition-all duration-500 shadow-sm"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              {modalConfig.loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-6"></div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Retrieving Secured Roster Data...</span>
                </div>
              ) : modalConfig.participants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 text-slate-300 rounded-[2rem] flex items-center justify-center mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Zone Currently Empty</h4>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs">No participants have been assigned to this seat group in the current ceremony configuration.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {modalConfig.participants.map(p => (
                    <div key={p.eventparticipant_id} className="flex items-center space-x-5 p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-primary-100 transition-all duration-300 group shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none">
                      <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl font-black transition-transform duration-500 group-hover:scale-110 ${p.type_name === 'Graduates' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {p.full_name ? p.full_name.charAt(0) : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h6 className="font-black text-slate-900 dark:text-slate-100 truncate text-base tracking-tight">{p.full_name}</h6>
                          <span className={`px-3 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-wider ${p.type_name === 'Graduates' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                            {p.type_name === 'Graduates' ? 'Grad' : 'Guest'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {p.type_name === 'Graduates' ? (
                            <>
                              <span className="text-[0.75rem] font-bold text-slate-400">ID: <span className="text-slate-600 dark:text-slate-300 font-black">{p.student_id}</span></span>
                              <span className="text-[0.75rem] font-bold text-slate-400">GPA: <span className="text-slate-600 dark:text-slate-300 font-black">{p.gpa}</span></span>
                              <span className="text-[0.75rem] font-bold text-slate-400">Grade: <span className="text-primary-600 font-black text-sm">{p.grade}</span></span>
                            </>
                          ) : (
                            <>
                               <span className="text-[0.75rem] font-bold text-slate-400 truncate">Phone: <span className="text-slate-600 dark:text-slate-300 font-black">{p.guest_phone || 'N/A'}</span></span>
                               <span className="text-[0.75rem] font-bold text-slate-400 truncate">Email: <span className="text-slate-600 dark:text-slate-300 font-black">{p.guest_email || 'N/A'}</span></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-8 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center space-x-6">
              <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest italic pr-4 border-r border-slate-200 dark:border-slate-700">Official Ceremony Audit Information</span>
              <button 
                onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                className="px-10 py-4 rounded-[1.5rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all shadow-sm"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVITATION GENERATION MODAL */}
      {invitationModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setInvitationModal({ ...invitationModal, isOpen: false })}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">Email & WhatsApp Invitations</h3>
                <p className="text-sm font-bold text-slate-400">Monitor background generation and delivery status</p>
              </div>
              <button onClick={() => setInvitationModal({ ...invitationModal, isOpen: false })} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-10 space-y-8">
              <div className="bg-primary-50 dark:bg-primary-900/10 p-8 rounded-[2rem] border border-primary-100 dark:border-primary-900/30">
                <label className="block text-xs font-black text-primary-600 uppercase tracking-widest mb-3">Invitations per Participant</label>
                <div className="flex items-center space-x-4">
                  <input 
                    type="number" 
                    min="1" 
                    max="5"
                    value={invitationModal.qtyPerPerson}
                    onChange={(e) => setInvitationModal({ ...invitationModal, qtyPerPerson: parseInt(e.target.value) || 1 })}
                    className="w-24 bg-white dark:bg-slate-800 border-2 border-primary-200 dark:border-slate-700 rounded-xl px-4 py-3 text-lg font-black text-center outline-none focus:border-primary-500 transition-all font-sans"
                  />
                  <p className="text-sm font-bold text-slate-500 italic">Set how many QR invitations each participant receives (Family allowance).</p>
                </div>
              </div>

              {invitationModal.batches.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  </div>
                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">No active batches</h4>
                  <p className="text-sm text-slate-500">Ready to generate new digital invitations for all assigned participants.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                  {invitationModal.batches.map(batch => (
                    <div key={batch.id} className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h5 className="font-black text-slate-900 dark:text-white tracking-tight">{batch.batch_name}</h5>
                          <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">{new Date(batch.created_at).toLocaleString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-widest ${
                          batch.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' :
                          batch.status === 'Failed' ? 'bg-rose-100 text-rose-600' :
                          'bg-primary-100 text-primary-600 animate-pulse'
                        }`}>
                          {batch.status}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-600 transition-all duration-1000" 
                          style={{ width: `${(batch.processed_count / (batch.total_count || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-[0.6rem] font-black text-slate-400 uppercase">{batch.processed_count} / {batch.total_count} PROCESSED</span>
                        {batch.status === 'Failed' && <span className="text-[0.6rem] font-bold text-rose-500 uppercase">Error: {batch.error_message}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                onClick={startGeneration}
                disabled={invitationModal.loading || (invitationModal.batches[0]?.status === 'Pending' || invitationModal.batches[0]?.status === 'Processing')}
                className="px-10 py-4 bg-primary-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {invitationModal.loading ? 'Queuing Batch...' : 'Start New Generation'}
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
