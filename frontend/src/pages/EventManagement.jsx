import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import EventModal from '../components/EventModal';
import AssignPeopleModal from '../components/AssignPeopleModal';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import ParticipantViewerModal from '../components/ParticipantViewerModal';
import ManagementModal from '../components/ManagementModal';
import { eventModelService } from '../services/api';


const EventManagement = ({ user, setIsSidebarOpen }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [assigningEvent, setAssigningEvent] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [managingEvent, setManagingEvent] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'success', message: '' });
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, type: 'primary', title: '', message: '', onConfirm: null });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (location.state?.openCreateEvent) {
      setSelectedEvent(null);
      setIsModalOpen(true);
      navigate('/admin/events', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await eventModelService.getAll();
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      showAlert('error', 'Could not refresh event registry');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlertConfig({ isOpen: true, type, message });
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, isOpen: false });
  };

  const closeConfirm = () => {
    setConfirmConfig({ ...confirmConfig, isOpen: false });
  };

  const handleCreateOrUpdate = async (formData) => {
    const executeAction = async () => {
      try {
        if (selectedEvent) {
          await eventModelService.update(selectedEvent.id, formData);
          showAlert('success', 'Event updated successfully');
        } else {
          await eventModelService.create(formData);
          showAlert('success', 'Event created successfully');
        }
        setIsModalOpen(false);
        setSelectedEvent(null);
        closeConfirm();
        fetchEvents();
      } catch (error) {
        showAlert('error', error.message || 'Operation failed');
      }
    };

    if (selectedEvent) {
      setConfirmConfig({
        isOpen: true,
        type: 'primary',
        title: 'Update Event',
        message: 'Are you sure you want to update this event? Changes will be applied immediately.',
        onConfirm: executeAction
      });
    } else {
      executeAction();
    }
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      type: 'danger',
      title: 'Delete Event',
      message: 'Are you sure you want to delete this event? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await eventModelService.delete(id);
          showAlert('success', 'Event deleted successfully');
          closeConfirm();
          fetchEvents();
        } catch (error) {
          showAlert('error', error.message || 'Deletion failed');
        }
      }
    });
  };

  const handleAssignPeople = (selectedIds) => {
    showAlert('success', `Successfully assigned ${selectedIds.length} people to ${assigningEvent?.event_name}`);
    setIsAssignModalOpen(false);
    setAssigningEvent(null);
  };

  const stats = [
    { label: 'Total Registry', value: events.length, icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )},
    { label: 'Active Schedule', value: events.filter(e => e.status === 'active').length, color: 'text-emerald-600', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    
    { label: 'Concluded', value: events.filter(e => e.status === 'finished').length, color: 'text-indigo-600', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { label: 'System Archived', value: events.filter(e => e.status === 'closed').length, color: 'text-slate-500', icon: (
       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
       </svg>
    )},
  ];

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-950 transition-all duration-500">
      <AdminHeader 
        title="Event Registry" 
        subtitle="Operational Schedule & Flow" 
        setIsOpen={setIsSidebarOpen} 
        user={user}
      >
        <button 
          onClick={() => {
            setSelectedEvent(null);
            setIsModalOpen(true);
          }}
          className="px-6 py-3.5 rounded-2xl bg-primary-600 text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 active:scale-95 flex items-center space-x-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
          </svg>
          <span>Initiate Event</span>
        </button>
      </AdminHeader>

      {/* Stats Section */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((s, i) => (
          <div key={i} className="group p-7 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium hover:shadow-premium-hover transition-all duration-500">
             <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 transition-colors group-hover:scale-110 duration-300 ${s.color?.replace('text-', 'text-') || 'text-slate-400'}`}>
                   {s.icon}
                </div>
                <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
             </div>
             <div>
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">{s.label}</h4>
                <p className={`text-4xl font-black tracking-tighter text-slate-900 dark:text-white ${s.color || ''}`}>
                   {loading ? <span className="animate-pulse opacity-20">••</span> : s.value}
                </p>
             </div>
          </div>
        ))}
      </section>

      {/* Table Section */}
      <section className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-center">
          <div className="flex items-center space-x-4">
             <div className="w-2 h-8 bg-primary-600 rounded-full animate-pulse"></div>
             <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">System Records</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Verified Institutional Data</p>
             </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/50 px-5 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Network Active</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 dark:bg-slate-800/30">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Specification</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timeline/Venue</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">State</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-32">
                    <div className="flex flex-col items-center space-y-6">
                      <div className="w-12 h-12 border-[3px] border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Accessing Cryptographic Records</span>
                    </div>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-40">
                    <div className="flex flex-col items-center space-y-6 opacity-40">
                       <div className="w-20 h-20 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                         <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                         </svg>
                       </div>
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Zero primary entries found</p>
                    </div>
                  </td>
                </tr>
              ) : events.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                  <td className="px-10 py-8">
                    <div className="flex flex-col space-y-1.5">
                      <span className="font-black text-slate-900 dark:text-white tracking-tight text-base group-hover:text-primary-600 transition-colors uppercase">{event.event_name}</span>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 line-clamp-1 italic tracking-tight">
                        {event.description || 'System-indexed graduation sequence'}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200">
                        <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[13px] font-black tracking-tight">
                          {new Date(event.event_date).toLocaleDateString(undefined, { 
                            month: 'short', day: 'numeric', year: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest flex items-center space-x-2">
                        <div className="w-1 h-1 bg-primary-600 rounded-full animate-pulse"></div>
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                      event.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/30' :
                      event.status === 'finished' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/30' :
                      'bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-800 dark:border-slate-700'
                    }`}>
                      <span className={`w-2 h-2 rounded-full mr-2.5 ${
                        event.status === 'active' ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                        event.status === 'finished' ? 'bg-indigo-500' :
                        'bg-slate-400'
                      }`}></span>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center justify-end space-x-3">
                        <button 
                          onClick={() => {
                            setManagingEvent(event);
                            setIsManageModalOpen(true);
                          }}
                          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600 hover:bg-white dark:hover:bg-slate-700 hover:shadow-premium transition-all duration-300"
                          title="Seating Architecture"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => {
                            setViewingEvent(event);
                            setIsViewerModalOpen(true);
                          }}
                          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-700 hover:shadow-premium transition-all duration-300"
                          title="Intelligence Viewer"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedEvent(event);
                            setIsModalOpen(true);
                          }}
                          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 hover:shadow-premium transition-all duration-300"
                          title="Config Tune"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(event.id)}
                          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-400 hover:text-rose-600 hover:bg-white dark:hover:bg-rose-900/30 hover:shadow-premium transition-all duration-300"
                          title="Purge Record"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        onSave={handleCreateOrUpdate}
        event={selectedEvent}
      />

      <AssignPeopleModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssigningEvent(null);
        }}
        onAssign={handleAssignPeople}
        event={assigningEvent}
      />

      <ParticipantViewerModal 
        isOpen={isViewerModalOpen}
        onClose={() => {
          setIsViewerModalOpen(false);
          setViewingEvent(null);
        }}
        event={viewingEvent}
      />

      <ManagementModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setManagingEvent(null);
        }}
        event={managingEvent}
        onActionComplete={showAlert}
      />

      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        message={alertConfig.message}
        onClose={closeAlert}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onClose={closeConfirm}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
};

export default EventManagement;
