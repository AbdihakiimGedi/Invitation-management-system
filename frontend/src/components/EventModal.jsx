import React, { useState, useEffect } from 'react';

const EventModal = ({ isOpen, onClose, onSave, event = null }) => {
  const [formData, setFormData] = useState({
    event_name: '',
    description: '',
    event_date: '',
    location: '',
    status: 'active',
    max_capacity: ''
  });

  useEffect(() => {
    if (event) {
      setFormData({
        event_name: event.event_name || '',
        description: event.description || '',
        event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
        location: event.location || '',
        status: event.status || 'active',
        max_capacity: event.max_capacity || ''
      });
    } else {
      setFormData({
        event_name: '',
        description: '',
        event_date: '',
        location: '',
        status: 'active',
        max_capacity: ''
      });
    }
  }, [event, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Strict Date Check: event_date >= today
    const now = new Date();
    const selectedDate = new Date(formData.event_date);
    
    // Compare date parts (YYYY-MM-DD) to allow today
    const todayStr = now.toISOString().split('T')[0];
    const selectedStr = selectedDate.toISOString().split('T')[0];

    if (selectedStr < todayStr) {
      alert("Invalid event date. Event date must be today or a future date.");
      return;
    }

    onSave(formData);
  };

  const minDate = new Date().toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl transition-all duration-500 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500 overflow-hidden">
        
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center space-x-4">
             <div className="w-1.5 h-8 bg-primary-600 rounded-full animate-pulse"></div>
             <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                  {event ? 'Update Planning' : 'Initialize Event'}
                </h2>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-0.5">
                  Registry Configuration Layer
                </p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 transition-all border border-slate-100 dark:border-slate-700 active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Event Designation</label>
              <input
                type="text"
                required
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400/50"
                value={formData.event_name}
                onChange={(e) => setFormData({...formData, event_name: e.target.value})}
                placeholder="Institutional Ceremony ID"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Time Dimension</label>
              <input
                type="datetime-local"
                required
                min={minDate}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-[13px] text-slate-900 dark:text-white cursor-pointer"
                value={formData.event_date}
                onChange={(e) => setFormData({...formData, event_date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Physical Venue / Coordinates</label>
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <input
                type="text"
                required
                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400/50"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Central Auditorium Main Terminal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">System Lifecycle Status</label>
              <div className="relative">
                <select
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-[13px] text-slate-900 dark:text-white appearance-none cursor-pointer"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Operational Status</option>
                  <option value="closed">Encrypted / Locked</option>
                  <option value="finished">Process Terminated</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Presence Threshold</label>
              <input
                type="number"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400/50"
                value={formData.max_capacity}
                onChange={(e) => setFormData({...formData, max_capacity: e.target.value})}
                placeholder="Maximum User Registry"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Institutional Overview</label>
            <textarea
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-[13px] text-slate-900 dark:text-white h-32 resize-none placeholder:text-slate-400/50 italic"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Provide a summary of the sequence objectives..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-10 py-8 border-t border-slate-50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-end gap-4 bg-slate-50 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] hover:text-slate-900 dark:hover:text-slate-200 transition-all order-2 sm:order-1"
          >
            Abort Process
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary-600/20 active:scale-95 transition-all order-1 sm:order-2"
          >
            {event ? 'Update Data Layer' : 'Commit Registry'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
