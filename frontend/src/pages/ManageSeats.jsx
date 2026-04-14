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
        title="Manage Seat Groups" 
        subtitle="Configure ceremony sections and zones" 
        setIsOpen={setIsSidebarOpen} 
        user={user}
      >
        <div className="flex items-center space-x-4">
          <select 
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-white dark:bg-slate-900 border-2 border-primary-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all cursor-pointer"
          >
            <option value="" disabled>--- Select Event ---</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.event_name}</option>
            ))}
          </select>
          <button 
            onClick={() => handleOpenModal()}
            disabled={!selectedEventId}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${
              !selectedEventId 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-600/20'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm">New Group</span>
          </button>
        </div>
      </AdminHeader>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {!selectedEventId ? (
          <div className="col-span-full flex flex-col items-center justify-center p-20 bg-white/50 dark:bg-slate-900/50 rounded-[3rem] border-4 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in duration-700">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-3xl flex items-center justify-center mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Select an Event</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-center max-w-xs">Please choose a graduation event from the dropdown above to manage its seat groups.</p>
          </div>
        ) : loading ? (
          <div className="col-span-full flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : seatGroups.length === 0 ? (
          <div className="col-span-full card-modern p-20 flex flex-col items-center justify-center text-slate-400">
            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="font-bold uppercase tracking-widest text-xs">No seat groups configured for this event</p>
          </div>
        ) : (
          seatGroups.map(group => (
            <div key={group.id} className="card-modern p-6 group hover:border-primary-500/30 transition-all relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Existing card content remains same */}
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${
                group.target_type === 'Student' ? 'bg-blue-500' : 
                group.target_type === 'Guest' ? 'bg-purple-500' : 'bg-emerald-500'
              }`}></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <span className={`px-3 py-1 rounded-full text-[0.6rem] font-black uppercase tracking-widest ${
                  group.target_type === 'Student' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  group.target_type === 'Guest' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}>
                  {group.target_type} Section
                </span>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(group)} className="p-2 text-slate-400 hover:text-primary-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(group.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{group.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2.5rem]">
                {group.description || 'No description provided for this ceremonial section.'}
              </p>
            </div>
          ))
        )}
      </section>

      {/* Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">
              {editingGroup ? 'Refine Group' : 'Initialize Section'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2 block">Section Name</label>
                <input 
                  type="text" required
                  placeholder="e.g., VIP Platinum, Grad-A+"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl outline-none focus:border-primary-600 transition-all font-bold"
                />
              </div>
              <div>
                <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2 block">Target Audience</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Student', 'Guest', 'Both'].map(type => (
                    <button
                      key={type} type="button"
                      onClick={() => setFormData({...formData, target_type: type})}
                      className={`py-3 rounded-xl text-xs font-bold transition-all border-2 ${
                        formData.target_type === type 
                          ? 'bg-primary-600 text-white border-primary-600' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700 hover:border-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2 block">Vision/Description</label>
                <textarea 
                  rows="3"
                  placeholder="Briefly describe the section hierarchy..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl outline-none focus:border-primary-600 transition-all font-bold"
                ></textarea>
              </div>
              <div className="flex space-x-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-900 transition-colors">Cancel</button>
                <button type="submit" className="flex-[2] btn-primary py-4 shadow-lg shadow-primary-600/20">
                  {editingGroup ? 'Sync Changes' : 'Finalize Group'}
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
