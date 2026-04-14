import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    fetchEvents();
  }, []);

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
        title="Ceremony Events" 
        subtitle="Operational Schedule & Registry" 
        setIsOpen={setIsSidebarOpen} 
        user={user}
      >
        <button 
          onClick={() => {
            setSelectedEvent(null);
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center space-x-2 shadow-lg shadow-primary-600/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-bold">Initiate Event</span>
        </button>
      </AdminHeader>

      {/* Stats Section */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((s, i) => (
          <div key={i} className="card-modern p-6 flex flex-col justify-between group hover:border-primary-200 transition-all">
             <div className="flex justify-between items-start mb-4">
                <span className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-primary-600 transition-colors ${s.color?.replace('text-', 'bg-').replace('-600', '-50')}`}>
                   {s.icon}
                </span>
                <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">Metrics</span>
             </div>
             <div>
                <h4 className="text-[0.65rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{s.label}</h4>
                <p className={`text-4xl font-bold tracking-tight text-slate-900 dark:text-white ${s.color || ''}`}>
                   {loading ? <span className="animate-pulse">...</span> : s.value}
                </p>
             </div>
          </div>
        ))}
      </section>

      {/* Registry Table Container */}
      <section className="card-modern rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none border-slate-100">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <div className="flex items-center space-x-3">
             <div className="w-1.5 h-8 bg-primary-600 rounded-full"></div>
             <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">System Registry</h3>
                <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">Authorized Records Only</p>
             </div>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-widest">
              Live Monitor
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-8 py-4 text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Event Specification</th>
                <th className="px-8 py-4 text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Timeline & Venue</th>
                <th className="px-8 py-4 text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Status</th>
                <th className="px-8 py-4 text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest text-right border-b border-slate-100 dark:border-slate-800">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-24">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Accessing Records...</span>
                    </div>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-32">
                    <div className="flex flex-col items-center space-y-4 opacity-40">
                       <svg className="w-16 h-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                       </svg>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No primary records identified</p>
                    </div>
                  </td>
                </tr>
              ) : events.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all group cursor-default">
                  <td className="px-8 py-6 max-w-sm">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base mb-1 group-hover:text-primary-600 transition-colors">{event.event_name}</span>
                      <span className="text-[0.7rem] font-medium text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                        {event.description || 'System-indexed graduation ceremony sequence.'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col space-y-1.5">
                      <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[0.8rem] font-bold">
                          {new Date(event.event_date).toLocaleDateString(undefined, { 
                            month: 'short', day: 'numeric', year: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="text-[0.65rem] text-primary-600 dark:text-primary-400 font-bold uppercase tracking-widest flex items-center space-x-1.5">
                        <div className="w-1 h-1 bg-primary-600 rounded-full"></div>
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[0.6rem] font-bold uppercase tracking-widest border ${
                      event.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/50' :
                      event.status === 'finished' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-900/50' :
                      'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800 dark:border-slate-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        event.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                        event.status === 'finished' ? 'bg-indigo-500' :
                        'bg-slate-400'
                      }`}></span>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => {
                            setManagingEvent(event);
                            setIsManageModalOpen(true);
                          }}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:shadow-sm transition-all"
                          title="Seating & Invitations"
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
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:shadow-sm transition-all"
                          title="View Intelligence"
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
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:shadow-sm transition-all"
                          title="Tune Configuration"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(event.id)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:shadow-sm transition-all"
                          title="Archive Record"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
