import React, { useState, useEffect, useRef } from 'react';

/**
 * HybridAutocomplete
 * A premium searchable dropdown that allows selecting existing values or typing new ones.
 */
const HybridAutocomplete = ({ 
  options = [], 
  value = '', 
  onChange, 
  placeholder = 'Search or type new...', 
  label = '', 
  required = false,
  disabled = false,
  error = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const wrapperRef = useRef(null);

  // Sync internal search term with external value (if it's a string)
  useEffect(() => {
    if (typeof value === 'object' && value !== null) {
      setSearchTerm(value.name || '');
    } else {
      setSearchTerm(value || '');
    }
  }, [value]);

  // Filter options based on search term
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = options.filter(opt => 
      opt.name.toLowerCase().includes(term)
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setIsOpen(true);
    
    // Check if the typed value matches an existing option exactly
    const match = options.find(opt => opt.name.toLowerCase() === val.toLowerCase());
    if (match) {
      onChange({ id: match.id, name: match.name, isNew: false });
    } else {
      onChange({ id: null, name: val, isNew: true });
    }
  };

  const handleOptionSelect = (opt) => {
    setSearchTerm(opt.name);
    setIsOpen(false);
    onChange({ id: opt.id, name: opt.name, isNew: false });
  };

  return (
    <div ref={wrapperRef} className="relative w-full group">
      {label && (
        <label className="block text-[0.6rem] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 transition-colors group-focus-within:text-primary-600">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
            error ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}`}
        />
        
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-[110] w-full mt-2 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleOptionSelect(opt)}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:text-primary-600 transition-all flex items-center justify-between group/opt"
                >
                  {opt.name}
                  <span className="opacity-0 group-hover/opt:opacity-100 text-[0.6rem] font-black uppercase tracking-widest text-primary-400">Select</span>
                </button>
              ))
            ) : searchTerm.trim() ? (
              <div className="px-4 py-3">
                <p className="text-[0.6rem] font-black uppercase tracking-widest text-amber-500 mb-1">New Entry Detected</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white italic">"{searchTerm}"</p>
              </div>
            ) : (
              <div className="px-4 py-3 text-sm font-bold text-slate-400 italic text-center">
                Type to search or add...
              </div>
            )}
          </div>
        )}
      </div>
      
      {error && <p className="text-red-500 text-[0.6rem] mt-1 font-bold italic">{error}</p>}
    </div>
  );
};

export default HybridAutocomplete;
