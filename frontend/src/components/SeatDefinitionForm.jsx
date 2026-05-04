import React, { useState } from 'react';

const SeatDefinitionForm = ({ onSave, onCancel, isProcessing }) => {
  const [groups, setGroups] = useState([
    { name: '', target_type: 'Student', quantity: '', description: '' }
  ]);

  const addRow = () => {
    setGroups([...groups, { name: '', target_type: 'Student', quantity: '', description: '' }]);
  };

  const removeRow = (index) => {
    setGroups(groups.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const newGroups = [...groups];
    newGroups[index][field] = value;
    setGroups(newGroups);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic validation
    const validGroups = groups.filter(g => g.name && g.quantity > 0);
    if (validGroups.length === 0) {
      alert('Please define at least one valid seat category with a quantity.');
      return;
    }
    onSave(validGroups);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-[0.7rem] font-black text-slate-400 uppercase tracking-[0.2em]">Seating Architecture Builder</h4>
          <button 
            type="button" 
            onClick={addRow}
            className="px-4 py-2 bg-primary-600 text-white text-[0.6rem] font-black uppercase tracking-widest rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
          >
            + Add Category
          </button>
        </div>

        <div className="space-y-4">
          {groups.map((group, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-end bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 group transition-all hover:border-primary-500/30">
              <div className="col-span-4 space-y-1">
                <label className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest ml-1">Group Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. VIP Section"
                  className="w-full bg-slate-50 dark:bg-slate-900 border-none p-3 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20"
                  value={group.name}
                  onChange={(e) => handleChange(index, 'name', e.target.value)}
                />
              </div>
              <div className="col-span-3 space-y-1">
                <label className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest ml-1">Target</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-900 border-none p-3 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20"
                  value={group.target_type}
                  onChange={(e) => handleChange(index, 'target_type', e.target.value)}
                >
                  <option value="Student">Graduate</option>
                  <option value="Guest">Guest</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div className="col-span-3 space-y-1">
                <label className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                <input 
                  type="number" 
                  placeholder="0"
                  className="w-full bg-slate-50 dark:bg-slate-900 border-none p-3 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20"
                  value={group.quantity}
                  onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                />
              </div>
              <div className="col-span-2 pb-1 text-right">
                {groups.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeRow(index)}
                    className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-4">
        <button 
          onClick={onCancel}
          className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={handleSubmit}
          disabled={isProcessing}
          className="flex-[2] py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
        >
          {isProcessing ? 'Saving Architecture...' : 'Finalize Seating Structure'}
        </button>
      </div>
    </div>
  );
};

export default SeatDefinitionForm;
