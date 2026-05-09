import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import { participantDirectoryService } from '../services/api';

const TYPE_TITLES = {
  graduates: 'Graduates',
  guests: 'Guests',
  vip_guests: 'VIP Guests'
};

const normalizeTypeSlug = (typeSlug = '') => {
  if (typeSlug === 'vips') return 'vip_guests';
  return typeSlug;
};

const formatDate = (value) => {
  if (!value) return 'Date pending';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getInitials = (name = '') => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map(part => part[0]?.toUpperCase())
  .join('') || 'P';

const ParticipantViewModal = ({ typeSlug, eventId, participantId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!typeSlug || !eventId || !participantId) return;

    let isMounted = true;
    const loadDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const details = await participantDirectoryService.getParticipantDetails(typeSlug, eventId, participantId);
        if (isMounted) setData(details);
      } catch (err) {
        if (isMounted) setError(err.message || 'Could not load participant details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [typeSlug, eventId, participantId]);

  if (!participantId) return null;

  const participant = data?.participant;
  const metadataEntries = Object.entries(participant?.metadata || {})
    .filter(([, value]) => value !== null && value !== undefined && value !== '');

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Participant Details</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Event assignment profile</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-600 transition-colors flex items-center justify-center"
            aria-label="Close participant details"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-[3px] border-primary-600 border-t-transparent animate-spin"></div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Loading details</span>
          </div>
        ) : error ? (
          <div className="py-24 text-center text-sm font-bold text-rose-600">{error}</div>
        ) : participant && (
          <div className="p-6 md:p-8">
            <div className="flex items-start gap-5 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-primary-600/20">
                {getInitials(participant.full_name)}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-widest text-primary-600 mb-2">
                  Student ID: {participant.student_id || participant.username}
                </p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{participant.full_name}</h3>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 truncate">{participant.email || 'No email stored'}</p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-widest text-slate-400">Username: {participant.username}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Role</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{participant.role}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">GPA</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{participant.gpa ?? 'Not stored'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Event</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{participant.event_name}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Event Date</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{formatDate(participant.event_date)}</p>
              </div>
            </div>

            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Stored Profile Data</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {metadataEntries.map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{key.replaceAll('_', ' ')}</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 text-right break-words">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PasswordModal = ({ credential, onClose }) => {
  const [copiedField, setCopiedField] = useState('');

  if (!credential) return null;

  const copyValue = async (label, value) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(label);
    setTimeout(() => setCopiedField(''), 1200);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Login Credential</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Generated 4-digit password</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-600 transition-colors flex items-center justify-center"
            aria-label="Close credential"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => copyValue('username', credential.username)}
            className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:ring-4 hover:ring-primary-600/10 transition-all"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Username</p>
            <div className="flex items-center justify-between gap-4">
              <p className="text-xl font-black text-slate-900 dark:text-white">{credential.username}</p>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">
                {copiedField === 'username' ? 'Copied' : 'Copy'}
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => copyValue('password', credential.password)}
            className="w-full text-left p-4 rounded-2xl bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/40 hover:ring-4 hover:ring-primary-600/10 transition-all"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-primary-600 mb-1">Password</p>
            <div className="flex items-center justify-between gap-4">
              <p className="text-4xl font-black tracking-[0.25em] text-primary-700 dark:text-primary-300">{credential.password}</p>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">
                {copiedField === 'password' ? 'Copied' : 'Copy'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

const EditParticipantModal = ({ typeSlug, eventId, participantId, onClose, onSaved }) => {
  const [data, setData] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!typeSlug || !eventId || !participantId) return;

    let isMounted = true;
    const loadDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const details = await participantDirectoryService.getParticipantDetails(typeSlug, eventId, participantId);
        if (!isMounted) return;
        setData(details);
        const participant = details.participant;
        const nextForm = {};
        (participant.editable_fields || []).forEach(field => {
          nextForm[field.name] = participant[field.name] ?? '';
        });
        setFormData(nextForm);
      } catch (err) {
        if (isMounted) setError(err.message || 'Could not load participant details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [typeSlug, eventId, participantId]);

  if (!participantId) return null;

  const fields = data?.participant?.editable_fields || [];

  const saveChanges = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      const result = await participantDirectoryService.updateParticipant(typeSlug, eventId, participantId, formData);
      onSaved?.(result);
    } catch (err) {
      setError(err.message || 'Could not save participant');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Edit Participant</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Update saved profile information</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-600 transition-colors flex items-center justify-center"
            aria-label="Close edit form"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-[3px] border-primary-600 border-t-transparent animate-spin"></div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Loading form</span>
          </div>
        ) : (
          <form onSubmit={saveChanges} className="p-6 md:p-8 space-y-5">
            {error && <div className="rounded-2xl bg-rose-50 border border-rose-100 px-5 py-3 text-sm font-bold text-rose-700">{error}</div>}

            {fields.map(field => (
              <label key={field.name} className="block">
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{field.label}</span>
                {field.type === 'select' ? (
                  <select
                    required={Boolean(field.required)}
                    value={formData[field.name] ?? ''}
                    onChange={(event) => setFormData(current => ({ ...current, [field.name]: event.target.value }))}
                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all"
                  >
                    <option value="">Select {field.label}</option>
                    {(field.options || []).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type || 'text'}
                    required={Boolean(field.required)}
                    step={field.type === 'number' ? '0.01' : undefined}
                    value={formData[field.name] ?? ''}
                    onChange={(event) => setFormData(current => ({ ...current, [field.name]: event.target.value }))}
                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all"
                  />
                )}
              </label>
            ))}

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 text-[11px] font-black uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-3 rounded-2xl bg-primary-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const ParticipantDirectory = ({ user, setIsSidebarOpen }) => {
  const params = useParams();
  const typeSlug = normalizeTypeSlug(params.typeSlug);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [typeMeta, setTypeMeta] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState(null);
  const [editingParticipantId, setEditingParticipantId] = useState(null);
  const [credential, setCredential] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      try {
        setLoadingEvents(true);
        setSelectedEventId('');
        setParticipants([]);
        setError('');
        const data = await participantDirectoryService.getEvents(typeSlug);
        if (!isMounted) return;
        setTypeMeta(data.type);
        setEvents(data.events || []);
      } catch (err) {
        if (isMounted) setError(err.message || 'Could not load events');
      } finally {
        if (isMounted) setLoadingEvents(false);
      }
    };

    loadEvents();
    return () => {
      isMounted = false;
    };
  }, [typeSlug]);

  useEffect(() => {
    if (!selectedEventId) {
      setParticipants([]);
      return;
    }

    let isMounted = true;
    const loadParticipants = async () => {
      try {
        setLoadingParticipants(true);
        setError('');
        const data = await participantDirectoryService.getParticipants(typeSlug, selectedEventId, {
          search: debouncedSearch
        });
        if (!isMounted) return;
        setTypeMeta(data.type);
        setParticipants(data.participants || []);
      } catch (err) {
        if (isMounted) setError(err.message || 'Could not load participants');
      } finally {
        if (isMounted) setLoadingParticipants(false);
      }
    };

    loadParticipants();
    return () => {
      isMounted = false;
    };
  }, [typeSlug, selectedEventId, debouncedSearch, refreshKey]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timeout = setTimeout(() => setSuccessMessage(''), 3500);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  const selectedEvent = useMemo(() => {
    return events.find(event => event.id === selectedEventId);
  }, [events, selectedEventId]);

  const title = typeMeta?.type_name || TYPE_TITLES[typeSlug] || 'Participants';
  const usernameLabel = typeMeta?.table_name === 'students' ? 'Student ID / Username' : 'Username';

  const generatePassword = async (participant) => {
    try {
      const data = await participantDirectoryService.generatePassword(
        typeSlug,
        selectedEventId,
        participant.eventparticipant_id
      );
      setCredential(data);
      setParticipants(current => current.map(item => (
        item.eventparticipant_id === participant.eventparticipant_id
          ? { ...item, has_login: true }
          : item
      )));
    } catch (err) {
      setError(err.message || 'Could not generate password');
    }
  };

  const showCredential = async (participant) => {
    try {
      const data = await participantDirectoryService.getCredential(
        typeSlug,
        selectedEventId,
        participant.eventparticipant_id
      );
      setCredential(data);
    } catch (err) {
      setError(err.message || 'Password has not been generated for this participant');
    }
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-950 transition-all duration-500">
      <AdminHeader
        title={title}
        subtitle="Event-based eligible participant directory"
        setIsOpen={setIsSidebarOpen}
        user={user}
      />

      <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-premium overflow-hidden mb-8">
        <div className="px-6 md:px-8 py-7 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Select Event</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Only eligible assigned participants are loaded</p>
        </div>

        <div className="p-6 md:p-8">
          <select
            value={selectedEventId}
            onChange={(event) => setSelectedEventId(event.target.value)}
            disabled={loadingEvents}
            className="w-full max-w-2xl px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all"
          >
            <option value="">{loadingEvents ? 'Loading events...' : 'Select an event'}</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.event_name} - {formatDate(event.event_date)}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && (
        <div className="mb-8 rounded-2xl border border-rose-100 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-4 text-sm font-bold text-emerald-700 shadow-sm">
          {successMessage}
        </div>
      )}

      {selectedEventId && (
        <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-premium overflow-hidden">
          <div className="px-6 md:px-8 py-7 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{selectedEvent?.event_name || title}</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
              {selectedEvent ? `${formatDate(selectedEvent.event_date)} / ${selectedEvent.location}` : 'Selected event'}
            </p>
          </div>

          {loadingParticipants ? (
            <div className="py-24 flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-[3px] border-primary-600 border-t-transparent animate-spin"></div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Loading participants</span>
            </div>
          ) : (
            <>
            <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                Search
              </label>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Name, Student ID / User ID, or email"
                className="w-full max-w-2xl px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/40">
                    <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Name</th>
                    <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Email</th>
                    <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{usernameLabel}</th>
                    <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">GPA</th>
                    <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {participants.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-20 text-center text-sm font-bold text-slate-400">
                        No eligible participants found for this event.
                      </td>
                    </tr>
                  ) : participants.map(participant => (
                    <tr key={participant.eventparticipant_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 md:px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-black">
                            {getInitials(participant.full_name)}
                          </div>
                          <span className="text-sm font-black text-slate-900 dark:text-white">{participant.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-5 text-sm font-bold text-slate-500 dark:text-slate-400">
                        {participant.email || 'Not stored'}
                      </td>
                      <td className="px-6 md:px-8 py-5 text-sm font-black text-slate-700 dark:text-slate-200">
                        {participant.username}
                      </td>
                      <td className="px-6 md:px-8 py-5 text-sm font-black text-slate-700 dark:text-slate-200">
                        {participant.gpa ?? 'Not stored'}
                      </td>
                      <td className="px-6 md:px-8 py-5">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedParticipantId(participant.eventparticipant_id)}
                            className="px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingParticipantId(participant.eventparticipant_id)}
                            className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 text-[11px] font-black uppercase tracking-widest hover:text-primary-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => showCredential(participant)}
                            className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 text-[11px] font-black uppercase tracking-widest hover:text-primary-600 transition-colors"
                          >
                            Show
                          </button>
                          <button
                            type="button"
                            onClick={() => generatePassword(participant)}
                            className="px-4 py-2.5 rounded-2xl bg-primary-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-700 transition-colors"
                          >
                            Generate Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </section>
      )}

      <ParticipantViewModal
        typeSlug={typeSlug}
        eventId={selectedEventId}
        participantId={selectedParticipantId}
        onClose={() => setSelectedParticipantId(null)}
      />
      <PasswordModal credential={credential} onClose={() => setCredential(null)} />
      <EditParticipantModal
        typeSlug={typeSlug}
        eventId={selectedEventId}
        participantId={editingParticipantId}
        onClose={() => setEditingParticipantId(null)}
        onSaved={(result) => {
          const participantName = result?.participant?.full_name || 'Participant';
          setSuccessMessage(`Updated Successfully: ${participantName}`);
          setEditingParticipantId(null);
          setRefreshKey(current => current + 1);
        }}
      />
    </div>
  );
};

export default ParticipantDirectory;
