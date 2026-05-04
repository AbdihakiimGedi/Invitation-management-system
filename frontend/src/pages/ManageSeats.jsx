import React, { useEffect, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import seatService from '../services/seatService';
import { eventModelService } from '../services/api';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';

const ManageSeats = ({ user, setIsSidebarOpen }) => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [seatGroups, setSeatGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({ name: '', target_type: 'Both', description: '' });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'success', message: '' });
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, type: 'primary', title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchSeatGroups();
    } else {
      setSeatGroups([]);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const data = await eventModelService.getAll();
      setEvents(data || []);
    } catch (error) {
      showAlert('error', 'Failed to fetch events');
    }
  };

  const fetchSeatGroups = async () => {
    try {
      setLoading(true);
      const data = await seatService.getGroups(selectedEventId);
      setSeatGroups(data || []);
    } catch (error) {
      showAlert('error', 'Failed to fetch seat groups');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlertConfig({ isOpen: true, type, message });
  };

  const handleOpenModal = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({ name: group.name, target_type: group.target_type, description: group.description || '' });
    } else {
      setEditingGroup(null);
      setFormData({ name: '', target_type: 'Both', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await seatService.updateGroup(editingGroup.id, formData);
        showAlert('success', 'Seat group updated successfully');
      } else {
        await seatService.createGroup({ ...formData, event_id: selectedEventId });
        showAlert('success', 'Seat group created successfully');
      }
      setIsModalOpen(false);
      fetchSeatGroups();
    } catch (error) {
      showAlert('error', error.message || 'Operation failed');
    }
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      type: 'danger',
      title: 'Delete Seat Group',
      message: 'Are you sure? All assignments to this group will be permanently removed.',
      onConfirm: async () => {
        try {
          await seatService.deleteGroup(id);
          showAlert('success', 'Seat group deleted successfully');
          setConfirmConfig({ ...confirmConfig, isOpen: false });
          fetchSeatGroups();
        } catch (error) {
          showAlert('error', 'Deletion failed');
        }
      }
    });
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-950 transition-all duration-500">
      <AdminHeader 
        title="Seating Architecture" 
        subtitle="Configure Ceremony Sections & Zones" 
        setIsOpen={setIsSidebarOpen} 
        user={user}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative group">
            <select 
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-3.5 text-[13px] font-black text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all cursor-pointer appearance-none uppercase tracking-tight"
            >
              <option value="" disabled>Select Core Event</option>
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
          
          <button 
            onClick={() => handleOpenModal()}
            disabled={!selectedEventId}
            className={`px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 ${
              !selectedEventId 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50 dark:bg-slate-800' 
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-xl shadow-primary-600/20 active:scale-95'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
            </svg>
            <span>Initialize Group</span>
          </button>
        </div>
      </AdminHeader>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
        {!selectedEventId ? (
          <div className="col-span-full flex flex-col items-center justify-center p-20 bg-white/40 dark:bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in duration-700">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-[2rem] flex items-center justify-center mb-8 border border-slate-100 dark:border-slate-700 shadow-sm">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tighter">Event Context Required</h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest text-center max-w-xs leading-relaxed opacity-60">Please select an operational event from the dropdown to initialize the seating grid.</p>
          </div>
        ) : loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-32 space-y-6">
            <div className="w-12 h-12 border-[3px] border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Accessing Grid Maps</span>
          </div>
        ) : seatGroups.length === 0 ? (
          <div className="col-span-full p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-8 opacity-40">
               <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
            </div>
            <p className="font-black uppercase tracking-[0.2em] text-[11px] text-slate-400 max-w-xs leading-relaxed">No primary seat groups have been configured for this sequence.</p>
          </div>
        ) : (
          seatGroups.map(group => (
            <div key={group.id} className="group p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium hover:shadow-premium-hover transition-all duration-500 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] opacity-10 transition-opacity duration-700 group-hover:opacity-20 ${
                group.target_type === 'Student' ? 'bg-blue-600' : 
                group.target_type === 'Guest' ? 'bg-indigo-600' : 'bg-emerald-600'
              }`}></div>
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm border ${
                  group.target_type === 'Student' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/30' :
                  group.target_type === 'Guest' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/30' :
                  'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/30'
                }`}>
                  {group.target_type} Terminal
                </span>
                <div className="flex space-x-1 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <button onClick={() => handleOpenModal(group)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(group.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter uppercase">{group.name}</h3>
              <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2.5rem] leading-relaxed italic opacity-80 pl-1">
                {group.description || 'System-indexed ceremonial section.'}
              </p>
            </div>
          ))
        )}
      </section>

      {/* Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-500 border border-slate-100 dark:border-slate-800">
             <div className="flex items-center space-x-4 mb-10">
                <div className="w-1.5 h-8 bg-primary-600 rounded-full animate-pulse"></div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                  {editingGroup ? 'Redefine Group' : 'Initialize Section'}
                </h2>
             </div>
             
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Section Designation</label>
                <input 
                  type="text" required
                  placeholder="e.g. Platinum VIP-1"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-600 transition-all font-black text-[13px] tracking-tight text-slate-900 dark:text-white"
                />
              </div>
              
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Audience Specification</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Student', 'Guest', 'Both'].map(type => (
                    <button
                      key={type} type="button"
                      onClick={() => setFormData({...formData, target_type: type})}
                      className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${
                        formData.target_type === type 
                          ? 'bg-primary-600 text-white border-primary-600 shadow-primary-600/20' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Architectural Brief</label>
                <textarea 
                  rows="3"
                  placeholder="Summarize the section's strategic purpose..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-600 transition-all font-bold text-[13px] text-slate-900 dark:text-white h-32 resize-none italic"
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-8 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors order-2 sm:order-1">Abort</button>
                <button type="submit" className="w-full sm:flex-1 py-5 rounded-2xl bg-primary-600 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary-600/20 hover:bg-primary-700 transition-all active:scale-95 order-1 sm:order-2">
                  {editingGroup ? 'Synchronize Data' : 'Commit Grid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertModal 
        isOpen={alertConfig.isOpen} 
        type={alertConfig.type} 
        message={alertConfig.message} 
        onClose={() => setAlertConfig({...alertConfig, isOpen: false})} 
      />
      
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onClose={() => setConfirmConfig({...confirmConfig, isOpen: false})}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
};

export default ManageSeats;
