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
        await seatService.assignPeople(selectedEventId, selectedSeatGroupId, {
          gpaGroups: selectedGroupLabels
        });
      } else {
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

  const handleRemoveAssignment = async (assignmentId) => {
    try {
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
    <div key={p.eventparticipant_id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group/item">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
           {p.full_name.charAt(0)}
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-tight">{p.full_name}</span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: {p.student_id || p.user_id}</span>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        {p.seat_group_id ? (
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/30 text-[8px] font-black uppercase tracking-widest">
              {p.seat_group_name}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); handleRemoveAssignment(p.eventparticipant_id); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all opacity-0 group-hover/item:opacity-100"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ) : (
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic group-hover/item:text-slate-400 transition-colors">Awaiting Grid</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-950 transition-all duration-500">
      <AdminHeader 
        title="People Distribution" 
        subtitle="Manage Ceremonial Grid Assignments" 
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
              <option value="" disabled>Select Core Sequence</option>
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
            onClick={handleAssign}
            disabled={selectedGroupLabels.length === 0 || !selectedSeatGroupId}
            className={`px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 ${
              (selectedGroupLabels.length === 0 || !selectedSeatGroupId) 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50 dark:bg-slate-800' 
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-xl shadow-primary-600/20 active:scale-95'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Assign Logic</span>
          </button>
        </div>
      </AdminHeader>

      <div className="mt-12 flex space-x-3 p-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-[1.5rem] w-fit mb-12">
        {['Students', 'Guests'].map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedGroupLabels([]); }}
            className={`px-10 py-3 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
              activeTab === tab 
                ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-md border border-slate-100 dark:border-slate-600' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* LEFT COLUMN: SOURCE GROUPS */}
        <div className="xl:col-span-8 space-y-8">
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center space-x-4">
                <div className="w-1.5 h-8 bg-primary-600 rounded-full animate-pulse"></div>
                <div>
                   <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                     {activeTab === 'Students' ? 'Graduation Taxonomy' : 'Guest Protocol Registry'}
                   </h3>
                   <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-0.5">Source Registry Selection</p>
                </div>
             </div>
          </div>

          {!selectedEventId ? (
            <div className="flex flex-col items-center justify-center p-24 bg-white/40 dark:bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in duration-700">
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-[2rem] flex items-center justify-center mb-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tighter text-center">Protocol Standby</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-widest text-center max-w-xs leading-relaxed opacity-60 italic">Please initialize a ceremony sequence to access distribution tools.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeTab === 'Students' ? (
                Object.keys(studentGroups).map(label => (
                  <div 
                    key={label}
                    onClick={() => toggleGroupLabel(label)}
                    className={`p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border transition-all duration-500 cursor-pointer relative overflow-hidden group ${
                      selectedGroupLabels.includes(label) 
                        ? 'border-primary-600 shadow-xl shadow-primary-600/10 dark:border-primary-500/50' 
                        : 'border-slate-100 dark:border-slate-800 shadow-premium hover:shadow-premium-hover hover:border-primary-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black transition-all duration-500 ${
                        selectedGroupLabels.includes(label) ? 'bg-primary-600 text-white shadow-lg' :
                        label.includes('A') ? 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/30' :
                        label.includes('B') ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/30' :
                        'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/30'
                      }`}>
                        {label}
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        {studentGroups[label].length} Entities
                      </span>
                    </div>
                    
                    <h4 className="text-xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter uppercase">Category {label}</h4>
                    
                    <div className="space-y-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleExpand(label); }}
                        className="text-[9px] font-black text-primary-600 uppercase tracking-[0.2em] flex items-center space-x-2 group/btn"
                      >
                        <span className="group-hover/btn:mr-1 transition-all">{expandedGroups.includes(label) ? 'Contract' : 'Expand'} Registry</span>
                        <svg className={`w-3.5 h-3.5 transition-transform duration-500 ${expandedGroups.includes(label) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {expandedGroups.includes(label) && (
                        <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 space-y-2 max-h-72 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-4 duration-500">
                          {studentGroups[label].map(s => renderParticipantItem(s))}
                        </div>
                      )}
                    </div>

                    <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-primary-600 rounded-full opacity-0 transition-all duration-700 blur-3xl ${selectedGroupLabels.includes(label) ? 'opacity-10' : ''}`}></div>
                  </div>
                ))
              ) : 
              (
                <div 
                  onClick={() => toggleGroupLabel('Guests')}
                  className={`p-10 rounded-[3rem] bg-white dark:bg-slate-900 border transition-all duration-500 cursor-pointer relative overflow-hidden col-span-full ${
                    selectedGroupLabels.includes('Guests') 
                      ? 'border-primary-600 shadow-xl shadow-primary-600/10' 
                      : 'border-slate-100 dark:border-slate-800 shadow-premium hover:shadow-premium-hover'
                  }`}
                >
                  <div className="flex justify-between items-center mb-10 relative z-10">
                    <div className="flex items-center space-x-5">
                       <div className="w-16 h-16 rounded-[1.8rem] bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/30 shadow-sm">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                       </div>
                       <div>
                          <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Protocol Guest Registry</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Consolidated Personnel Map</p>
                       </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-5 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                      {guests.length} Validated
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 mt-8 pt-10 border-t border-slate-50 dark:border-slate-800 max-h-[30rem] overflow-y-auto custom-scrollbar">
                    {guests.map(g => renderParticipantItem(g))}
                  </div>

                  <div className={`absolute -right-10 -bottom-10 w-48 h-48 bg-primary-600 rounded-full opacity-0 transition-all duration-700 blur-[80px] ${selectedGroupLabels.includes('Guests') ? 'opacity-10' : ''}`}></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: TARGET SEAT GROUPS */}
        <div className="xl:col-span-4 space-y-8">
          <div className="flex items-center space-x-4 mb-2">
             <div className="w-1.5 h-8 bg-emerald-600 rounded-full animate-pulse"></div>
             <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Target Grid Zones</h3>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-0.5">Physical Destination Mapping</p>
             </div>
          </div>

          <div className="space-y-5">
            {!selectedEventId ? (
              <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/30 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800/50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Zonal Maps Encrypted</p>
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
                  className={`p-6 rounded-[2rem] cursor-pointer transition-all duration-500 border-2 relative overflow-hidden group/zone ${
                    selectedSeatGroupId === sg.id 
                      ? 'border-emerald-600 bg-emerald-50/10 shadow-lg shadow-emerald-600/5' 
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-500/40 shadow-premium hover:shadow-premium-hover'
                  }`}
                >
                  <div className="flex items-center space-x-5 relative z-10">
                    <div className={`w-14 h-14 rounded-[1.3rem] flex items-center justify-center border-2 transition-all duration-500 ${
                      selectedSeatGroupId === sg.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'
                    }`}>
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="font-black text-[15px] text-slate-900 dark:text-white tracking-tight uppercase group-hover/zone:text-emerald-600 transition-colors">{sg.name}</h5>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">{sg.target_type} Operational</p>
                    </div>
                  </div>

                  <div className={`absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-600 rounded-full opacity-0 transition-all duration-1000 blur-3xl ${selectedSeatGroupId === sg.id ? 'opacity-10' : ''}`}></div>
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
