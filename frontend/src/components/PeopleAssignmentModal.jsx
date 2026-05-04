import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertModal from './AlertModal';
import ConfirmModal from './ConfirmModal';
import { peopleService, eventModelService } from '../services/api';
import seatService from '../services/seatService';
import SeatDefinitionForm from './SeatDefinitionForm';

const PeopleAssignmentModal = ({ isOpen, onClose, user }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Selection States
  const [events, setEvents] = useState([]);
  const [peopleTypes, setPeopleTypes] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  
  // File States
  const [file, setFile] = useState(null);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [schemaFields, setSchemaFields] = useState([]); // [{ column, type, label, lookupTable? }]
  const [serverFilePath, setServerFilePath] = useState('');
  const [mapping, setMapping] = useState({});
  
  // Student Specific States
  const [importedStudents, setImportedStudents] = useState([]);
  const [exclusions, setExclusions] = useState([]); // Array of { student_id, reason }
  const [importSummary, setImportSummary] = useState(null);

  // Modal & Alert States
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'success', message: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, type: 'primary', title: '', message: '', onConfirm: null });
  const [showSeatForm, setShowSeatForm] = useState(false);

  // Seating States
  const [seatingStatus, setSeatingStatus] = useState({ checked: false, initialized: false });

  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      const init = async () => {
        try {
          const [evs, types] = await Promise.all([
            eventModelService.getAll(),
            peopleService.getTypes()
          ]);
          // Filter to only show active events for assignment
          setEvents(evs.filter(e => e.status === 'active'));
          setPeopleTypes(types);
        } catch (err) {
          console.error('Initialization failed:', err);
        }
      };
      init();
    } else {
      // Reset state on close
      setStep(1);
      setFile(null);
      setSelectedEventId('');
      setSelectedTypeId('');
      setSchemaFields([]);
      setMapping({});
      setImportedStudents([]);
      setExclusions([]);
      setSeatingStatus({ checked: false, initialized: false });
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedEventId) {
      checkSeating();
    }
  }, [selectedEventId]);

  const checkSeating = async () => {
    try {
      const groups = await seatService.getGroups(selectedEventId);
      setSeatingStatus({ checked: true, initialized: groups.length > 0 });
    } catch (error) {
      setSeatingStatus({ checked: true, initialized: false });
    }
  };

  const handleInitializeSeating = async (groups) => {
    setLoading(true);
    try {
      await seatService.initializeSeats(selectedEventId, groups);
      showAlert('success', 'Seating architecture finalized successfully.');
      setSeatingStatus({ checked: true, initialized: true });
      setShowSeatForm(false);
    } catch (error) {
      showAlert('error', error.message || 'Failed to initialize seating.');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlertConfig({ isOpen: true, type, message });
  };

   useEffect(() => {
    if (step !== 4) {
      setSearchTerm('');
      setFilteredData(null);
    }
  }, [step]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm) {
        try {
          const type = peopleTypes.find(t => t.id === selectedTypeId);
          const results = await peopleService.searchPreview(searchTerm, type?.type_name || 'student');
          setFilteredData(results);
        } catch (error) {
          console.error("Search failed", error);
        }
      } else {
        setFilteredData(null);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedTypeId]);

  const isStudentType = () => {
     const type = peopleTypes.find(t => t.id === selectedTypeId);
     if (!type) return false;
     const name = type.type_name.toLowerCase();
     return name.includes('student') || name.includes('graduate');
   };

   const isGuestType = () => {
     const type = peopleTypes.find(t => t.id === selectedTypeId);
     if (!type) return false;
     const name = type.type_name.toLowerCase();
     return name.includes('guest');
   };

  const proceedToUpload = async () => {
    if (!selectedEventId || !selectedTypeId) {
      showAlert('error', 'Selection required to continue.');
      return;
    }

    if (!seatingStatus.initialized) {
      showAlert('error', 'Seating must be initialized for this event before assigning participants.');
      return;
    }

    const type = peopleTypes.find(t => t.id === selectedTypeId);
    setLoading(true);
    try {
      const schema = await peopleService.getSchema(type.table_name);
      if (!schema || schema.length === 0) {
        showAlert('error', `Mapping schema unavailable for "${type.type_name}".`);
        return;
      }
      setSchemaFields(schema);
      setStep(2);
    } catch (err) {
      showAlert('error', 'Failed to synchronize table schema.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    
    setLoading(true);
    try {
      const data = await peopleService.uploadPreview(selectedFile);
      setFileHeaders(data.headers);
      setServerFilePath(data.filePath);

      const initialMapping = {};
      data.headers.forEach(h => {
        const normalised = h.trim().toLowerCase().replace(/\s+/g, '_');
        const schemaMatch = schemaFields.find(f => {
          const colName = f.column.toLowerCase();
          return colName === normalised || 
                 colName === 'has_' + normalised || 
                 normalised === 'has_' + colName;
        });
        if (schemaMatch) initialMapping[h] = schemaMatch.column;
      });
      setMapping(initialMapping);
      setStep(3);
    } catch (err) {
      showAlert('error', 'Manifest parsing failed. Invalid format.');
    } finally {
      setLoading(false);
    }
  };

  const runImport = async (confirmCapacity = false) => {
    const type = peopleTypes.find(t => t.id === selectedTypeId);
    setLoading(true);
    setConfirmConfig({ ...confirmConfig, isOpen: false });
    
    try {
      const result = await peopleService.importPeople({
        tableName: type.table_name,
        eventId: selectedEventId,
        mapping: mapping,
        filePath: serverFilePath,
        typeName: type.type_name,
        confirmCapacity
      });
      
      if (result.status === 'capacity_exceeded') {
        setConfirmConfig({
          isOpen: true,
          type: 'primary',
          title: 'Capacity Threshold Exceeded',
          message: `The manifest exceeds available venue slots. Only ${result.remainingCapacity} participants can be added. Proceed with partial synchronize?`,
          onConfirm: () => runImport(true)
        });
        return;
      }

      if (isStudentType()) {
        const studentIdKey = Object.keys(mapping).find(k => mapping[k] === 'student_id');
        const nameKey = Object.keys(mapping).find(k => mapping[k] === 'full_name');
        
        const normalized = result.data.map(row => ({
          student_id: row[studentIdKey],
          full_name: row[nameKey]
        }));
        
        // AUTO-EXCLUSION INTEGRATION
        const autoExclusions = result.data
          .filter(row => row.is_auto_excluded)
          .map(row => ({
            student_id: row[studentIdKey],
            reason: row.exclusion_reason
          }));

        setExclusions(autoExclusions);
        setImportedStudents(normalized);
        setImportSummary(result);
        setStep(4);
      } else if (isGuestType()) {
        const nameKey = Object.keys(mapping).find(k => mapping[k] === 'guest_name');
        const normalized = result.data.map((row, idx) => ({
          student_id: String(row.guest_id), // Use the real ID returned from DB
          full_name: row[nameKey]
        }));
        setImportedStudents(normalized);
        setImportSummary(result);
        setStep(4);
      } else {
        setImportSummary(result);
        setStep(5);
      }
    } catch (err) {
      console.error('Import Error Details:', err);
      showAlert('error', err.message || 'Synchronization failed.');
    } finally {
      setLoading(false);
    }
  };

  const finalizeParticipation = async () => {
    const includedCount = importedStudents.length - exclusions.length;
    const excludedCount = exclusions.length;

    setConfirmConfig({
      isOpen: true,
      type: 'primary',
      title: 'Authorize Registry Entry',
      message: `Finalizing manifest will authorize ${includedCount} participants and record ${excludedCount} exclusions. Are you sure you want to proceed?`,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
          const type = peopleTypes.find(t => t.id === selectedTypeId);
          await peopleService.processParticipation({
            eventId: selectedEventId,
            studentData: importedStudents, // Original manifest defines the scope
            exclusions: exclusions,
            typeName: type?.type_name
          });
          showAlert('success', 'Success! Registry manifest has been successfully authorized and synchronized.');
          setStep(5);
        } catch (err) {
          showAlert('error', err.message || 'Communication failure during finalization.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleFinalSave = () => {
    if (!importSummary) return onClose();

    const inserted = importSummary.addedToEvent || 0;
    const skipped = (importSummary.alreadyInEvent || 0) + (importSummary.skippedDueToCapacity || 0);
    const totalAccounted = inserted + skipped;
    const errors = Math.max(0, importSummary.totalRows - totalAccounted);

    const message = `Import Completed Successfully!\n\nInserted: ${inserted} records\nSkipped: ${skipped} rows\nErrors: ${errors} row${errors !== 1 ? 's' : ''}\n\nClick OK to continue.`;

    setAlertConfig({
      isOpen: true,
      type: 'success',
      message,
      isFinal: true
    });
  };

  const toggleExclusion = (studentId) => {
    setExclusions(prev => {
      const exists = prev.find(e => e.student_id === studentId);
      if (exists) {
        return prev.filter(e => e.student_id !== studentId);
      } else {
        return [...prev, { student_id: studentId, reason: 'Finance issue' }];
      }
    });
  };

  const updateReason = (studentId, reason) => {
    setExclusions(prev => prev.map(e => 
      e.student_id === studentId ? { ...e, reason } : e
    ));
  };

  if (!isOpen) return null;

  const isAdvanced = isStudentType() || isGuestType();
  const totalSteps = isAdvanced ? 5 : 4;
  const currentStepLabel = step > totalSteps ? totalSteps : step;
  const typeLabel = peopleTypes.find(t => t.id === selectedTypeId)?.type_name || 'People';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 transition-all">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in" onClick={onClose}></div>

      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 max-h-[90vh]">
        
        <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight italic uppercase">
              People <span className="text-primary-600">Assignment</span>
            </h2>
            <p className="text-[0.6rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Master Synchronisation Wizard</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white dark:bg-slate-800 rounded-xl text-slate-400 hover:text-red-500 transition-colors shadow-sm border border-slate-100 dark:border-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-12 py-8 flex items-center justify-between relative mt-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i+1} className="flex flex-col items-center relative z-10">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all shadow-lg ${
                step >= i+1 ? 'bg-primary-600 text-white shadow-primary-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {i+1}
              </div>
            </div>
          ))}
          <div className="absolute top-1/2 left-0 h-0.5 bg-slate-100 dark:bg-slate-800 w-full z-0 px-20"></div>
          <div className="absolute top-1/2 left-0 h-0.5 bg-primary-600 transition-all duration-700 z-0 px-20 transform -translate-y-1/2 ml-20" 
               style={{ width: `${Math.max(0, ((step - 1) / (totalSteps - 1)) * 75)}%` }}></div>
        </div>

        <div className="overflow-y-auto px-12 pb-12 custom-scrollbar">
          {step === 1 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5">
              <div className="space-y-2">
                <label className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-2">Registry Event</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl text-slate-900 dark:text-white font-bold outline-none border border-slate-200 dark:border-slate-800 focus:border-primary-600 appearance-none transition-all"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  <option value="">Select operational ceremony...</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.event_name}</option>)}
                </select>

                {selectedEventId && seatingStatus.checked && (
                  <div className={`mt-4 p-5 rounded-2xl border transition-all duration-500 ${
                    seatingStatus.initialized 
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' 
                      : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
                  }`}>
                    {showSeatForm ? (
                      <SeatDefinitionForm 
                        onSave={handleInitializeSeating}
                        onCancel={() => setShowSeatForm(false)}
                        isProcessing={loading}
                      />
                    ) : (
                      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${seatingStatus.initialized ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}></div>
                          <span className={`text-[0.65rem] font-black uppercase tracking-widest ${seatingStatus.initialized ? 'text-emerald-600' : 'text-amber-600'}`}>
                            Seating Architecture: {seatingStatus.initialized ? 'Initialized' : 'Pending Configuration'}
                          </span>
                        </div>
                        <button 
                          onClick={() => setShowSeatForm(true)}
                          disabled={loading}
                          className="px-4 py-2 bg-amber-600 text-white text-[0.6rem] font-black uppercase tracking-widest rounded-xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20 active:scale-95 disabled:opacity-50"
                        >
                          {seatingStatus.initialized ? 'Modify Architecture' : 'Define Seats Now'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-2">Classification</label>
                <div className="grid grid-cols-2 gap-4">
                  {peopleTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedTypeId(type.id)}
                      className={`p-6 rounded-[2rem] border transition-all text-left ${
                        selectedTypeId === type.id 
                          ? 'bg-primary-600 border-primary-500 text-white shadow-xl shadow-primary-600/20' 
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-primary-500/50'
                      }`}
                    >
                      <span className="block text-xl font-bold italic tracking-tighter">{type.type_name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={proceedToUpload} disabled={loading} className="w-full btn-primary py-5 text-sm uppercase tracking-widest shadow-xl shadow-primary-600/10">
                {loading ? 'Processing...' : 'Authorize & Synchronize manifest'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center space-y-10 animate-in zoom-in-95">
               <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[2rem] mx-auto flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                 </svg>
               </div>
               <div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase italic tracking-tighter">Manifest Upload</h3>
                 <p className="text-slate-400 font-bold text-[0.65rem] uppercase tracking-widest mt-2 px-20">Select an official registry file (XLSX, CSV) for synchronization.</p>
               </div>
               <label className="block w-full">
                 <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                 <div className="w-full btn-primary py-5 cursor-pointer active:scale-95 shadow-xl shadow-primary-600/10 text-sm">
                   {loading ? 'Analyzing Manifest...' : 'Access Local File'}
                 </div>
               </label>
               <button onClick={() => setStep(1)} className="text-primary-600 font-bold text-[0.65rem] uppercase tracking-widest underline underline-offset-8 decoration-primary-500/30">Reset Selection</button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in">
               <div className="flex justify-between items-center mb-8 px-2">
                 <div className="flex items-center gap-3">
                   <span className="px-5 py-2 bg-slate-900 dark:bg-slate-800 text-white text-[0.6rem] font-bold uppercase tracking-widest rounded-full">
                      {Object.keys(mapping).length} / {schemaFields.length} Defined
                   </span>
                   {(() => {
                     const missing = schemaFields.filter(f => f.required && !Object.values(mapping).includes(f.column));
                     if (missing.length > 0) {
                       return <span className="text-[0.6rem] font-bold text-amber-600 uppercase tracking-widest border border-amber-200 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20">⚠️ Required: {missing.map(m => m.label).join(', ')}</span>;
                     }
                     return <span className="text-[0.6rem] font-bold text-emerald-600 uppercase tracking-widest">✅ Valid Mapping Configuration</span>;
                   })()}
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                 {fileHeaders.map((header) => {
                   const mappedField = schemaFields.find(f => f.column === mapping[header]);
                   const isLookup = mappedField?.type === 'lookup';
                   return (
                     <div key={header} className={`bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border flex items-center justify-between group transition-all ${
                       isLookup ? 'border-amber-400/60 shadow-sm' : 'border-slate-100 dark:border-slate-800'
                     }`}>
                        <div className="flex flex-col gap-1">
                          <span className="text-[0.65rem] font-bold text-slate-900 dark:text-white uppercase tracking-widest">{header}</span>
                          {isLookup && <span className="text-[0.5rem] font-bold text-amber-600 uppercase tracking-widest">🔗 Resource Link: {mappedField.label}</span>}
                        </div>
                        <select 
                          className="bg-white dark:bg-slate-950 p-3 rounded-xl text-[0.6rem] font-bold uppercase tracking-widest outline-none border border-slate-200 dark:border-slate-800 focus:border-primary-500 transition-all"
                          value={mapping[header] || ''}
                          onChange={(e) => setMapping({...mapping, [header]: e.target.value})}
                         >
                           <option value="">— Skip —</option>
                           {schemaFields.map(field => (
                             <option key={field.column} value={field.column}>
                               {field.label}{field.type === 'lookup' ? ' 🔗' : ''}{field.required ? ' *' : ''}
                             </option>
                           ))}
                         </select>
                     </div>
                   );
                 })}
               </div>
               <div className="flex space-x-4">
                 <button onClick={() => setStep(2)} className="flex-1 btn-secondary text-[0.65rem] uppercase text-slate-400">Change Manifest</button>
                 {(() => {
                   const missing = schemaFields.filter(f => f.required && !Object.values(mapping).includes(f.column));
                   const isValid = missing.length === 0 && Object.keys(mapping).length > 0;
                   return (
                     <button onClick={() => runImport()} disabled={loading || !isValid} className="flex-2 btn-primary py-5 px-10 text-[0.65rem] uppercase tracking-widest shadow-xl shadow-primary-600/10">
                        {loading ? 'Processing...' : 'Initialize Synchronization'}
                     </button>
                   );
                 })()}
               </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in">
              <div className="mb-8 flex justify-between items-end">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase italic tracking-tighter">Participation Filtering</h3>
                  <p className="text-slate-400 font-bold text-[0.6rem] uppercase tracking-widest mt-1">Search the registry and categorize exclusions.</p>
                </div>
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">
                  {importedStudents.length - exclusions.length} Scheduled
                </div>
              </div>
              
              <div className="mb-6 relative">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                 </div>
                 <input
                   type="text"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
                   placeholder="Search by ID or Name..."
                 />
              </div>

              <div className="card-modern overflow-hidden mb-10 border-slate-100 shadow-sm">
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left relative">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
                      <tr className="text-[0.6rem] font-bold uppercase tracking-widest text-slate-400">
                        <th className="px-8 py-4 w-16">Active</th>
                        <th className="px-8 py-4">Registry ID</th>
                        <th className="px-8 py-4">Full Identity</th>
                        <th className="px-8 py-4">Exclusion Logic</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {(() => {
                        const displayData = searchTerm ? (filteredData || []) : importedStudents;
                        if (displayData.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} className="px-8 py-10 text-center font-bold text-slate-400 uppercase tracking-widest text-[0.6rem]">
                                No results found
                              </td>
                            </tr>
                          );
                        }
                        return displayData.map((s) => {
                          const exclusion = exclusions.find(e => e.student_id === s.student_id);
                          const isExcluded = !!exclusion;
                          return (
                            <tr key={s.student_id} className={`transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${isExcluded ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                              <td className="px-8 py-4">
                                <input type="checkbox" checked={!isExcluded} onChange={() => toggleExclusion(s.student_id)} className="w-5 h-5 rounded-md accent-primary-600 grayscale hover:grayscale-0 transition-all cursor-pointer" />
                              </td>
                              <td className="px-8 py-4 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tighter">{s.student_id}</td>
                              <td className="px-8 py-4 text-xs font-bold text-slate-900 dark:text-white tracking-tight uppercase">{s.full_name}</td>
                              <td className="px-8 py-4">
                                {isExcluded && !isGuestType() && (
                                  <select 
                                    value={exclusion.reason}
                                    onChange={(e) => updateReason(s.student_id, e.target.value)}
                                    className="bg-white dark:bg-slate-950 p-2.5 rounded-xl text-[0.6rem] font-bold uppercase tracking-widest text-red-600 outline-none border border-red-200"
                                  >
                                    <option value="Finance issue">Finance Requirement</option>
                                    <option value="Exam issue">Academic Integrity</option>
                                  </select>
                                )}
                                {isExcluded && isGuestType() && (
                                  <span className="text-[0.6rem] font-bold uppercase text-red-500 tracking-widest">Excluded by Admin</span>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex space-x-4">
                <button onClick={() => setStep(3)} className="flex-1 btn-secondary text-[0.65rem] uppercase">Back to Mapping</button>
                <button onClick={finalizeParticipation} disabled={loading} className="flex-2 btn-primary py-5 px-10 text-[0.65rem] uppercase tracking-widest">
                  {loading ? 'Storing manifest...' : 'Authorize Registry Entry'}
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in zoom-in duration-700">
               <div className="text-center mb-10">
                  <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full mx-auto flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                     </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Workflow Complete</h3>
                  <p className="text-slate-400 font-bold text-[0.6rem] uppercase tracking-widest">Master Synchronisation Successful</p>
               </div>

                {importSummary && (
                 <div className="card-modern bg-slate-50/50 dark:bg-slate-900/30 p-10 border-slate-100 shadow-sm mb-10 tracking-tight">
                    <div className="flex items-center space-x-3 mb-8">
                       <div className="w-1.5 h-6 bg-primary-600 rounded-full"></div>
                       <h4 className="text-[0.65rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Audit Intelligence Summary</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                          <div className="flex justify-between items-center group">
                             <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest shrink-0">Rows Processed</span>
                             <span className="text-xl font-bold text-slate-900 dark:text-white italic">{importSummary.totalRows}</span>
                          </div>
                          <div className="flex justify-between items-center group">
                             <span className="text-[0.65rem] font-bold text-emerald-600 uppercase tracking-widest shrink-0">{typeLabel} Assigned</span>
                             <span className="text-xl font-bold text-emerald-600 italic tracking-tighter">+{importSummary.addedToEvent}</span>
                          </div>
                          <div className="flex justify-between items-center group">
                             <span className="text-[0.65rem] font-bold text-red-600 uppercase tracking-widest shrink-0">Capacity Skips</span>
                             <span className="text-xl font-bold text-red-600 italic">{importSummary.skippedDueToCapacity}</span>
                          </div>
                       </div>
                       
                       <div className="space-y-6 md:border-l md:border-slate-200/50 md:pl-8 dark:md:border-slate-800/50">
                          <div className="flex justify-between items-center group">
                             <span className="text-[0.65rem] font-bold text-amber-600 uppercase tracking-widest shrink-0">Venue Slots Left</span>
                             <span className="text-xl font-bold text-amber-600 italic">{importSummary.remainingCapacity}</span>
                          </div>
                          <div className="flex justify-between items-center group">
                             <span className="text-[0.65rem] font-bold text-indigo-600 uppercase tracking-widest shrink-0">Existing Records</span>
                             <span className="text-xl font-bold text-indigo-600 italic">{importSummary.alreadyInEvent}</span>
                          </div>
                          {isStudentType() && (
                            <div className="flex justify-between items-center group">
                               <span className="text-[0.65rem] font-bold text-primary-600 uppercase tracking-widest shrink-0">New Registry Components</span>
                               <span className="text-xl font-bold text-primary-600 italic tracking-tighter">{importSummary.newFaculties + importSummary.newDepartments}</span>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
               )}

               <p className="text-center text-slate-400 font-bold text-[0.6rem] leading-relaxed mb-10 uppercase tracking-widest px-10">Data integrity has been verified. All relational mappings are stored in the secure system registry.</p>
               <button onClick={handleFinalSave} className="w-full btn-primary py-6 text-sm uppercase tracking-widest shadow-xl shadow-primary-600/10">Save</button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen} 
        title={confirmConfig.title} 
        message={confirmConfig.message} 
        type={confirmConfig.type}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })} 
        onConfirm={confirmConfig.onConfirm} 
      />

      <AlertModal 
        isOpen={alertConfig.isOpen} 
        type={alertConfig.type} 
        message={alertConfig.message} 
        onClose={() => {
          setAlertConfig({...alertConfig, isOpen: false});
          if (alertConfig.isFinal) onClose();
        }} 
      />
    </div>
  );
};

export default PeopleAssignmentModal;

