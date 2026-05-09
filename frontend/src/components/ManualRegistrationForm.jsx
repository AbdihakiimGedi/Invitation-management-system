import React, { useState, useEffect } from 'react';
import { peopleService } from '../services/api';
import HybridAutocomplete from './HybridAutocomplete';

/**
 * ManualRegistrationForm
 * A dynamic form that renders input fields based on DB schema.
 * Supports hybrid autocomplete fields (Faculties, Departments) as dependent inputs.
 * Allows adding multiple entries to a local staging list before batch submission.
 */

const ManualRegistrationForm = ({ schemaFields, typeName, typeId, onRegistered, onBack, eventId }) => {
  const [formData, setFormData] = useState({});
  const [stagedEntries, setStagedEntries] = useState([]);
  const [lookupData, setLookupData] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch lookup data (faculties) on mount
  useEffect(() => {
    const fetchFaculties = async () => {
      setLoading(true);
      
      // Sanitize labels in schemaFields for cleaner error messages
      schemaFields.forEach(f => {
        if (f.column === 'faculty_id') f.label = 'Faculty';
        if (f.column === 'department_id') f.label = 'Department';
      });

      const hasFacultyLookup = schemaFields.some(f => f.type === 'lookup' && f.lookupTable === 'faculties');
      if (!hasFacultyLookup) {
        setLoading(false);
        return;
      }

      try {
        const faculties = await peopleService.getLookupData('faculties');
        setLookupData(prev => ({ ...prev, faculties }));
      } catch (err) {
        console.error('Faculty fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaculties();
  }, [schemaFields]);

  // Dependent Fetch: Fetch departments from API when faculty changes
  useEffect(() => {
    const facultyObj = formData['faculty_id'];
    if (facultyObj && !facultyObj.isNew && facultyObj.id) {
      const fetchDepts = async () => {
        try {
          console.log(`[DEBUG] Fetching departments for Faculty ID: ${facultyObj.id}`);
          const depts = await peopleService.getDepartmentsByFaculty(facultyObj.id);
          console.log(`[DEBUG] Received ${depts.length} departments:`, depts);
          setLookupData(prev => ({ ...prev, departments: depts }));
        } catch (err) {
          console.error('Failed to fetch filtered departments:', err);
          setLookupData(prev => ({ ...prev, departments: [] }));
        }
      };
      fetchDepts();
    } else {
      // If faculty is new or empty, clear departments list
      setLookupData(prev => ({ ...prev, departments: [] }));
    }
  }, [formData['faculty_id']?.id, formData['faculty_id']?.isNew]);

  const getFilteredDepartments = () => {
    return lookupData.departments || [];
  };

  const validate = () => {
    const errors = {};
    schemaFields.forEach(field => {
      const val = formData[field.column];
      if (field.required) {
        if (typeof val === 'object' && val !== null) {
          if (!val.name?.trim()) errors[field.column] = `${field.label} is required`;
        } else if (!val?.toString().trim()) {
          errors[field.column] = `${field.label} is required`;
        }
      }
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddToStaging = () => {
    if (!validate()) return;

    // Deep clone formData to ensure all keys are preserved
    const entry = JSON.parse(JSON.stringify(formData));
    
    // Explicit safety check for student_id
    if (!entry.student_id && formData.student_id) {
      entry.student_id = formData.student_id;
    }

    setStagedEntries(prev => [...prev, entry]);
    setFormData({});
    setFieldErrors({});
  };

  const handleRemoveStaged = (index) => {
    setStagedEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitAll = async () => {
    if (stagedEntries.length === 0) return;
    setSubmitting(true);
    try {
      const result = await peopleService.manualRegister({
        eventId,
        typeId,
        typeName,
        data: stagedEntries
      });
      onRegistered(result, stagedEntries);
    } catch (err) {
      console.error('Manual registration failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (column, value) => {
    setFormData(prev => {
      const next = { ...prev, [column]: value };
      
      // Smart Department Reset Logic
      if (column === 'faculty_id') {
        const currentDept = prev['department_id'];
        const newFaculty = value; // { id, name, isNew }

        if (currentDept && !currentDept.isNew) {
          // If we have an existing department, validate it against the new faculty
          if (newFaculty && !newFaculty.isNew && newFaculty.id) {
            // Check if this department exists under the new faculty
            const isStillValid = lookupData.departments?.some(d => 
              String(d.id) === String(currentDept.id) && 
              String(d.faculty_id) === String(newFaculty.id)
            );
            if (!isStillValid) {
              delete next['department_id'];
            }
          } else if (newFaculty && newFaculty.name?.trim()) {
            // If a NEW faculty is typed, any existing department is invalid
            delete next['department_id'];
          }
          // If newFaculty is empty/null, we keep the department (user might select faculty later)
        }
      }
      return next;
    });

    if (fieldErrors[column]) {
      setFieldErrors(prev => ({ ...prev, [column]: null }));
    }
  };

  // Columns to hide from the manual form
  const hiddenCols = ['created_at', 'updated_at', 'user_id', 'student_id_fk', 'guest_id'];

  const visibleFields = schemaFields.filter(f => !hiddenCols.includes(f.column));

  const renderField = (field) => {
    const val = formData[field.column] || '';
    const err = fieldErrors[field.column];

    // Hybrid Autocomplete: Faculty
    if (field.type === 'lookup' && field.lookupTable === 'faculties') {
      return (
        <HybridAutocomplete
          key={field.column}
          label="Faculty"
          required={field.required}
          options={lookupData.faculties || []}
          value={val}
          onChange={(newVal) => handleChange(field.column, newVal)}
          placeholder="Search or type new faculty..."
          error={err}
        />
      );
    }

    // Hybrid Autocomplete: Department (Strict Transformation Logic)
    if (field.type === 'lookup' && field.lookupTable === 'departments') {
      const facultyObj = formData['faculty_id'];
      const facultyEntered = !!(facultyObj?.name?.trim());
      const isNewFaculty = !!(facultyObj?.isNew);
      const filteredDepts = getFilteredDepartments();
      
      // Target Behavior Logic
      // - Faculty selected + departments exist => Hybrid Dropdown
      // - Faculty selected + no departments => Text input only
      // - Faculty typed (new) => Text input only
      const showDropdown = facultyEntered && !isNewFaculty && filteredDepts.length > 0;

      return (
        <HybridAutocomplete
          key={field.column}
          label="Department"
          required={field.required}
          options={showDropdown ? filteredDepts : []}
          value={val}
          onChange={(newVal) => handleChange(field.column, newVal)}
          disabled={!facultyEntered}
          placeholder={
            !facultyEntered ? "Select faculty first..." : 
            isNewFaculty ? "Type new department name..." :
            filteredDepts.length === 0 ? "No departments found. Type new one..." :
            "Search or type new department..."
          }
          error={err}
        />
      );
    }

    const labelEl = (
      <label className="block text-[0.6rem] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );

    const inputClass = `w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
      err ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
    }`;

    // Boolean fields (has_finance_issue, has_exam_issue)
    if (field.column.startsWith('has_')) {
      return (
        <div key={field.column} className="flex flex-col">
          {labelEl}
          <select
            value={val}
            onChange={(e) => handleChange(field.column, e.target.value)}
            className={inputClass}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>
      );
    }

    // Relation type for guests
    if (field.column === 'relation_type') {
      return (
        <div key={field.column} className="flex flex-col">
          {labelEl}
          <select
            value={val}
            onChange={(e) => handleChange(field.column, e.target.value)}
            className={inputClass}
          >
            <option value="">— Optional —</option>
            {['Father', 'Mother', 'Brother', 'Sister', 'Spouse', 'Guest'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      );
    }

    // Degree level for graduates
    if (field.column === 'degree_level') {
      return (
        <div key={field.column} className="flex flex-col">
          {labelEl}
          <select
            value={val}
            onChange={(e) => handleChange(field.column, e.target.value)}
            className={inputClass}
          >
            <option value="">— Select Level —</option>
            <option value="Bachelor's">Bachelor's</option>
            <option value="Master's">Master's</option>
            <option value="PhD">PhD</option>
          </select>
          {err && <p className="text-red-500 text-[0.6rem] mt-1">{err}</p>}
        </div>
      );
    }

    // Number / Decimal fields
    if (field.column === 'gpa' || field.column === 'academic_percentage') {
      return (
        <div key={field.column} className="flex flex-col">
          {labelEl}
          <input
            type="number"
            step="0.01"
            min="0"
            max={field.column === 'gpa' ? '4' : '100'}
            value={val}
            placeholder={field.column === 'gpa' ? '0.00 – 4.00' : '0 – 100'}
            onChange={(e) => handleChange(field.column, e.target.value)}
            className={inputClass}
          />
          {err && <p className="text-red-500 text-[0.6rem] mt-1">{err}</p>}
        </div>
      );
    }

    // Email
    if (field.column === 'email') {
      return (
        <div key={field.column} className="flex flex-col">
          {labelEl}
          <input
            type="email"
            value={val}
            placeholder="email@example.com"
            onChange={(e) => handleChange(field.column, e.target.value)}
            className={inputClass}
          />
          {err && <p className="text-red-500 text-[0.6rem] mt-1">{err}</p>}
        </div>
      );
    }

    // Phone
    if (field.column === 'phone') {
      return (
        <div key={field.column} className="flex flex-col">
          {labelEl}
          <input
            type="tel"
            value={val}
            placeholder="+252..."
            onChange={(e) => handleChange(field.column, e.target.value)}
            className={inputClass}
          />
          {err && <p className="text-red-500 text-[0.6rem] mt-1">{err}</p>}
        </div>
      );
    }

    // Default: text input
    return (
      <div key={field.column} className="flex flex-col">
        {labelEl}
        <input
          type="text"
          value={val}
          placeholder={field.label}
          onChange={(e) => handleChange(field.column, e.target.value)}
          className={inputClass}
        />
        {err && <p className="text-red-500 text-[0.6rem] mt-1">{err}</p>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-8">
      {/* Form Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase italic tracking-tighter">
              Register Entry
            </h3>
            <p className="text-slate-400 font-bold text-[0.6rem] uppercase tracking-widest mt-1">
              Fill in details and add to staging list
            </p>
          </div>
          <span className="px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 text-[0.6rem] font-black uppercase tracking-widest rounded-full border border-primary-100 dark:border-primary-900/40">
            {stagedEntries.length} Staged
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleFields.map(field => renderField(field))}
        </div>

        <button
          onClick={handleAddToStaging}
          className="w-full py-4 border-2 border-dashed border-primary-400 dark:border-primary-700 text-primary-600 text-[0.65rem] font-black uppercase tracking-widest rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
          Add to Staging List
        </button>
      </div>

      {/* Staged Entries Preview */}
      {stagedEntries.length > 0 && (
        <div className="space-y-3">
          <p className="text-[0.6rem] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Staging List — {stagedEntries.length} {stagedEntries.length === 1 ? 'Entry' : 'Entries'}
          </p>
          <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-2">
            {stagedEntries.map((entry, idx) => {
              const displayName = entry.full_name || entry.guest_name || entry.student_id || `Entry ${idx + 1}`;
              const displayId   = entry.student_id || entry.email || '';
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between px-5 py-3 bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl"
                >
                  <div>
                    <span className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                      {displayName}
                    </span>
                    {displayId && (
                      <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">{displayId}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveStaged(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
                    title="Remove"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4 pt-2">
        <button
          onClick={onBack}
          className="flex-1 btn-secondary text-[0.65rem] uppercase"
        >
          Back
        </button>
        <button
          onClick={handleSubmitAll}
          disabled={submitting || stagedEntries.length === 0}
          className="flex-2 btn-primary py-5 px-10 text-[0.65rem] uppercase tracking-widest shadow-xl shadow-primary-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? 'Registering...'
            : `Register ${stagedEntries.length} ${stagedEntries.length === 1 ? 'Entry' : 'Entries'}`}
        </button>
      </div>
    </div>
  );
};

export default ManualRegistrationForm;
