import React, { useEffect, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import seatService from '../services/seatService';
import { eventModelService } from '../services/api';
import AlertModal from '../components/AlertModal';

const SeatAssignment = ({ user, setIsSidebarOpen }) => {
  const [activeTab, setActiveTab] = useState('Students');
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [studentGroups, setStudentGroups] = useState({});
  const [guests, setGuests] = useState([]);
  const [seatGroups, setSeatGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Selection States
  const [selectedGroupLabels, setSelectedGroupLabels] = useState([]); // Array of strings (e.g. ['A+', 'A'])
  const [selectedSeatGroupId, setSelectedSeatGroupId] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState([]);

  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'success', message: '' });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchData();
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const data = await eventModelService.getAll();
      setEvents(data || []);
      // REMOVED: Auto-selection of first event to enforce manual choice
    } catch (error) {
      showAlert('error', 'Failed to fetch events');
    }
  };

  const fetchData = async () => {
    if (!selectedEventId) return;
    try {
      setLoading(true);
      const [sGroups, gList, sGroupsList] = await Promise.all([
        seatService.getStudentGroups(selectedEventId),
        seatService.getGuests(selectedEventId),
        seatService.getGroups(selectedEventId)
      ]);
      setStudentGroups(sGroups || {});
      setGuests(gList || []);
      setSeatGroups(sGroupsList || []);
      
      // Clear selections on event change
      setSelectedGroupLabels([]);
      setSelectedSeatGroupId(null);
    } catch (error) {
      showAlert('error', 'Failed to synchronize data');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlertConfig({ isOpen: true, type, message });
  };

  const toggleGroupLabel = (label) => {
    if (activeTab === 'Guests') {
      setSelectedGroupLabels([label]);
      return;
    }

    setSelectedGroupLabels(prev => {
      if (prev.includes(label)) {
        return prev.filter(l => l !== label);
      } else {
        return [...prev, label];
      }
    });
  };

  const toggleExpand = (label) => {
    if (expandedGroups.includes(label)) {
      setExpandedGroups(expandedGroups.filter(l => l !== label));
    } else {
      setExpandedGroups([...expandedGroups, label]);
    }
  };

  const handleAssign = async () => {
    if (selectedGroupLabels.length === 0 || !selectedSeatGroupId) {
      showAlert('error', 'Please select at least one group and a target seat zone');
      return;
    }

    const seatGroup = seatGroups.find(sg => sg.id === selectedSeatGroupId);
    let totalAffected = 0;
    
    if (activeTab === 'Students') {
      selectedGroupLabels.forEach(label => {
        totalAffected += studentGroups[label]?.length || 0;
      });
    } else {
      totalAffected = guests.length;
    }

    if (totalAffected === 0) {
      showAlert('error', 'The selected groups have no participants to assign.');
      return;
    }

    const confirmMessage = activeTab === 'Students' 
      ? `You are assigning students from [ ${selectedGroupLabels.join(', ')} ] groups to "${seatGroup?.name}". This will affect ${totalAffected} students. Proceed?`
      : `You are assigning all registered Guests (${totalAffected}) to "${seatGroup?.name}". Proceed?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      if (activeTab === 'Students') {
        // Use the new bulkAssignByGpaGroups endpoint
        await seatService.assignPeople(selectedEventId, selectedSeatGroupId, {
          gpaGroups: selectedGroupLabels
        });
      } else {
        // Maintenance of Guest logic: use individual IDs
        const participantIds = guests.map(g => g.eventparticipant_id);
        await seatService.assignPeople(selectedEventId, selectedSeatGroupId, {
          participantIds
        });
      }
      
      showAlert('success', `Successfully synchronized ${totalAffected} assignments to "${seatGroup?.name}".`);
      fetchData();
    } catch (error) {
      showAlert('error', error.message || 'Bulk assignment transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualAssign = async (eventparticipant_id, seatGroupId) => {
    try {
      await seatService.assignPeople(selectedEventId, seatGroupId, { participantIds: [eventparticipant_id] });
      showAlert('success', 'Individual assigned successfully');
      fetchData();
    } catch (error) {
      showAlert('error', error.message || 'Operation failed');
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    try {
      // Need a way to find assignment ID if we only have participant ID
      // For now, let's assume we fetch assignments or use a dedicated endpoint
      // Adjusting SeatModel/Controller to handle removal by participant ID might be easier
      // Let's use the deleteAssignment endpoint with proper ID
      // I'll fetch assignments separately to map ep_id -> assignment_id
      const assignments = await seatService.getAssignments(selectedEventId);
      const assignment = assignments.find(a => a.eventparticipant_id === assignmentId);
      if (assignment) {
        await seatService.removeAssignment(assignment.id);
        showAlert('success', 'Assignment removed');
        fetchData();
      }
    } catch (error) {
      showAlert('error', 'Failed to remove assignment');
    }
  };

  const renderParticipantItem = (p) => (
    <div key={p.eventparticipant_id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors group/item shadow-none hover:shadow-sm">
      <div className="flex flex-col">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{p.full_name}</span>
        <span className="text-[0.6rem] font-medium text-slate-400">ID: {p.student_id || p.user_id}</span>
      </div>
      <div className="flex items-center space-x-2">
        {p.seat_group_id ? (
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[0.6rem] font-bold uppercase tracking-wider">
              {p.seat_group_name}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); handleRemoveAssignment(p.eventparticipant_id); }}
              className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all opacity-0 group-hover/item:opacity-100"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ) : (
          <span className="text-[0.6rem] font-bold text-slate-300 uppercase tracking-widest italic group-hover/item:text-slate-400 transition-colors">Pending</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-950 transition-all duration-500">
      <AdminHeader 
        title="People Assignment" 
        subtitle="Distribute participants across ceremonial zones" 
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
          <button 
            onClick={handleAssign}
            disabled={selectedGroupLabels.length === 0 || !selectedSeatGroupId}
            className={`btn-primary flex items-center space-x-2 px-8 shadow-lg transition-all ${(selectedGroupLabels.length === 0 || !selectedSeatGroupId) ? 'opacity-50 grayscale scale-95' : 'shadow-primary-600/20'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-sm font-bold">Assign Selection</span>
          </button>
        </div>
      </AdminHeader>

      <div className="mt-8 flex space-x-2 p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl w-fit mb-8">
        {['Students', 'Guests'].map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedGroupLabels([]); }}
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* LEFT COLUMN: SOURCE GROUPS */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center space-x-3 mb-4">
             <div className="w-1.5 h-6 bg-primary-600 rounded-full"></div>
             <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
               {activeTab === 'Students' ? 'Graduation Categories' : 'Guest Registry'}
             </h3>
          </div>

          {!selectedEventId ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white/50 dark:bg-slate-900/50 rounded-[2rem] border-4 border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Assignment Engine Standby</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-center max-w-xs">Please select an active event from the dropdown above to initialize graduation categories and ceremonial zones.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTab === 'Students' ? (
                Object.keys(studentGroups).map(label => (
                  <div 
                    key={label}
                    onClick={() => toggleGroupLabel(label)}
                    className={`card-modern p-6 transition-all cursor-pointer relative ${
                      selectedGroupLabels.includes(label) 
                        ? 'border-primary-600 ring-4 ring-primary-600/10' 
                        : 'hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                        label.includes('A') ? 'bg-blue-50 text-blue-600' :
                        label.includes('B') ? 'bg-indigo-50 text-indigo-600' :
                        label.includes('C') ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {label}
                      </div>
                      <span className="text-[0.6rem] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                        {studentGroups[label].length} Students
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white mb-4 tracking-tight">Grade Group {label}</h4>
                    
                    <div className="space-y-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleExpand(label); }}
                        className="text-[0.65rem] font-bold text-primary-600 uppercase tracking-widest flex items-center space-x-1"
                      >
                        <span>{expandedGroups.includes(label) ? 'Collapse Roster' : 'View Roster'}</span>
                        <svg className={`w-3 h-3 transition-transform ${expandedGroups.includes(label) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {expandedGroups.includes(label) && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-4 duration-300">
                          {studentGroups[label].map(s => renderParticipantItem(s))}
                        </div>
                      )}
                    </div>

                    {selectedGroupLabels.includes(label) && (
                      <div className="absolute top-4 right-4 animate-in zoom-in duration-300">
                        <div className="bg-primary-600 text-white p-1 rounded-full">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : 
              (
                <div 
                  onClick={() => toggleGroupLabel('Guests')}
                  className={`card-modern p-6 transition-all cursor-pointer relative col-span-2 ${
                    selectedGroupLabels.includes('Guests') 
                      ? 'border-primary-600 ring-4 ring-primary-600/10' 
                      : 'hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                       </svg>
                    </div>
                    <span className="text-[0.6rem] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                      {guests.length} Registered
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mb-4 tracking-tight">Consolidated Guest List</h4>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 max-h-[20rem] overflow-y-auto custom-scrollbar">
                    {guests.map(g => renderParticipantItem(g))}
                  </div>
    
                  {selectedGroupLabels.includes('Guests') && (
                    <div className="absolute top-4 right-4 animate-in zoom-in duration-300">
                      <div className="bg-primary-600 text-white p-1 rounded-full">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: TARGET SEAT GROUPS */}
        <div className="xl:col-span-4 space-y-6">
          <div className="flex items-center space-x-3 mb-4">
             <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
             <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Target Seat Groups</h3>
          </div>

          <div className="space-y-4">
            {!selectedEventId ? (
              <div className="p-8 text-center bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Zones Hidden</p>
              </div>
            ) : (
              seatGroups.filter(sg => 
                sg.target_type === 'Both' || 
                (activeTab === 'Students' && sg.target_type === 'Student') || 
                (activeTab === 'Guests' && sg.target_type === 'Guest')
              ).map(sg => (
                <div 
                  key={sg.id}
                  onClick={() => setSelectedSeatGroupId(sg.id)}
                  className={`card-modern p-5 cursor-pointer transition-all border-2 relative overflow-hidden group ${
                    selectedSeatGroupId === sg.id 
                      ? 'border-emerald-600 bg-emerald-50/10' 
                      : 'hover:border-emerald-200'
                  }`}
                >
                  <div className="flex items-center space-x-4 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${
                      selectedSeatGroupId === sg.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'
                    }`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="font-black text-slate-900 dark:text-white tracking-tight">{sg.name}</h5>
                      <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">{sg.target_type} Allowed</p>
                    </div>
                  </div>

                  <div className={`absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-600 rounded-full opacity-0 transition-opacity blur-2xl ${selectedSeatGroupId === sg.id ? 'opacity-10' : ''}`}></div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AlertModal 
        isOpen={alertConfig.isOpen} 
        type={alertConfig.type} 
        message={alertConfig.message} 
        onClose={() => setAlertConfig({...alertConfig, isOpen: false})} 
      />
    </div>
  );
};

export default SeatAssignment;
