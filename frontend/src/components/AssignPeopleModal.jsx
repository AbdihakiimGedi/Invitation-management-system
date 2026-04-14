import React, { useState, useEffect } from 'react';

const AssignPeopleModal = ({ isOpen, onClose, onAssign, event }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');

  // Realistic mock data for graduates, guests, and vips
  const mockPeople = [
    { id: 1, name: 'Ahmed Abdullah', role: 'Graduate', department: 'Computer Science' },
    { id: 2, name: ' Sara Yousif', role: 'Graduate', department: 'Medicine' },
    { id: 3, name: 'Ibrahim Ali', role: 'Guest', department: 'Invited by Ahmed' },
    { id: 4, name: 'Siham Mohammed', role: 'Special Guest', department: 'University Council' },
    { id: 5, name: 'Mustafa Hassan', role: 'Graduate', department: 'Engineering' },
    { id: 6, name: 'Layla Idris', role: 'Guest', department: 'Family Invitation' },
  ];

  const categories = ['All', 'Graduate', 'Guest', 'Special Guest'];

  const filteredPeople = mockPeople.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || person.role === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const togglePerson = (id) => {
    setSelectedPeople(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const currentIds = filteredPeople.map(p => p.id);
    setSelectedPeople(prev => [...new Set([...prev, ...currentIds])]);
  };

  const deselectAll = () => {
    const currentIds = filteredPeople.map(p => p.id);
    setSelectedPeople(prev => prev.filter(id => !currentIds.includes(id)));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-hidden">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Delegate Invitations
              </h2>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                Event: {event?.event_name || 'General Ceremony'}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search & Categories */}
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search individuals by name..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 pl-12 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-lg text-[0.65rem] font-bold uppercase tracking-wider transition-all border ${
                    activeCategory === cat 
                      ? 'bg-primary-600 text-white border-primary-500 shadow-lg shadow-primary-600/20' 
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-primary-500/50'
                  }`}
                >
                  {cat}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content - Scrollable List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-6">
          <div className="flex justify-between items-center mb-6 px-1">
            <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">
              Available Pool ({filteredPeople.length})
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={selectAll} 
                className="text-[0.65rem] font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest transition-colors"
              >
                Select Global
              </button>
              <button 
                onClick={deselectAll} 
                className="text-[0.65rem] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
              >
                Clear Selected
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredPeople.map(person => (
              <div 
                key={person.id}
                onClick={() => togglePerson(person.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                  selectedPeople.includes(person.id)
                    ? 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800'
                    : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${
                    selectedPeople.includes(person.id) 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'
                  }`}>
                    {person.name[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{person.name}</h4>
                    <p className="text-[0.65rem] text-slate-400 font-medium tracking-wide mt-0.5">
                      {person.role} <span className="mx-1">•</span> {person.department}
                    </p>
                  </div>
                </div>
                
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  selectedPeople.includes(person.id)
                    ? 'bg-primary-600 border-primary-600'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}>
                  {selectedPeople.includes(person.id) && (
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            ))}

            {filteredPeople.length === 0 && (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/20 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                 <p className="text-slate-400 font-bold uppercase text-[0.65rem] tracking-widest">Refine search criteria</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">{selectedPeople.length}</span>
            <span className="text-[0.6rem] text-slate-400 font-bold uppercase tracking-widest mt-1">Pending Assignment</span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-sm bg-white dark:bg-slate-800 hover:bg-slate-100 transition-all border border-slate-200 dark:border-slate-700"
            >
              Discard
            </button>
            <button
              onClick={() => onAssign(selectedPeople)}
              disabled={selectedPeople.length === 0}
              className={`px-8 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-lg ${
                selectedPeople.length > 0 
                  ? 'bg-primary-600 text-white shadow-primary-600/25 hover:bg-primary-700' 
                  : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              Deploy Invitations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignPeopleModal;
