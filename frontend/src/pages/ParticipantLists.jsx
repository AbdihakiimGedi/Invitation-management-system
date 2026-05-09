import React, { useEffect, useMemo, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import { participantListService } from '../services/api';

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

const ParticipantDetailsModal = ({ eventId, participantId, onClose }) => {
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId || !participantId) return;

    let isMounted = true;
    const loadDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await participantListService.getParticipantDetails(eventId, participantId);
        if (isMounted) setParticipant(data);
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
  }, [eventId, participantId]);

  if (!participantId) return null;

  const metadataEntries = Object.entries(participant?.metadata || {})
    .filter(([, value]) => value !== null && value !== undefined && value !== '');

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Participant Record</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Database detail view</p>
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
          <div className="grid md:grid-cols-[1fr_360px]">
            <section className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-5 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-primary-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-primary-600/20">
                  {getInitials(participant.full_name)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{participant.full_name}</h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 truncate">{participant.email || 'No email stored'}</p>
                  <div className="mt-3 inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                    {participant.role}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Event</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{participant.event_name}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{participant.status || 'Not stored'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Date</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{formatDate(participant.event_date)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Location</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{participant.location || 'Not stored'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Stored Metadata</h4>
                {metadataEntries.length === 0 ? (
                  <p className="text-sm font-bold text-slate-400">No additional metadata is stored for this participant.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {metadataEntries.map(([key, value]) => (
                      <div key={key} className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{key.replaceAll('_', ' ')}</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 text-right break-words">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <aside className="p-6 md:p-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/40">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5">Invitation QR Code</h4>
              {participant.qr_code ? (
                <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
                  <img src={participant.qr_code} alt="Invitation QR code" className="w-64 h-64 object-contain" />
                </div>
              ) : (
                <div className="w-64 h-64 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-center px-8">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">No invitation QR stored yet</span>
                </div>
              )}
              {participant.invitation_status && (
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {participant.invitation_status}
                </p>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

const ParticipantLists = ({ user, setIsSidebarOpen }) => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [listData, setListData] = useState(null);
  const [activeTypeId, setActiveTypeId] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingLists, setLoadingLists] = useState(false);
  const [error, setError] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [filters, setFilters] = useState({ search: '', gpaRange: '' });

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      try {
        setLoadingEvents(true);
        const data = await participantListService.getEvents();
        if (isMounted) setEvents(data || []);
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
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setListData(null);
      setActiveTypeId('');
      return;
    }

    let isMounted = true;
    const loadLists = async () => {
      try {
        setLoadingLists(true);
        setError('');
        const data = await participantListService.getEventLists(selectedEventId, filters);
        if (!isMounted) return;
        setListData(data);
        setActiveTypeId(prev => data.tabs?.some(tab => tab.type_id === prev) ? prev : data.tabs?.[0]?.type_id || '');
      } catch (err) {
        if (isMounted) setError(err.message || 'Could not load participant lists');
      } finally {
        if (isMounted) setLoadingLists(false);
      }
    };

    loadLists();
    return () => {
      isMounted = false;
    };
  }, [selectedEventId, filters]);

  const activeTab = useMemo(() => {
    return listData?.tabs?.find(tab => tab.type_id === activeTypeId) || null;
  }, [activeTypeId, listData]);

  const applyFilters = (event) => {
    event.preventDefault();
    setSelectedParticipantId(null);
    setFilters(current => ({
      ...current,
      search: searchDraft.trim()
    }));
  };

  const updateGpaFilter = (gpaRange) => {
    setSelectedParticipantId(null);
    setFilters(current => ({
      ...current,
      gpaRange
    }));
  };

  const clearFilters = () => {
    setSearchDraft('');
    setSelectedParticipantId(null);
    setFilters({ search: '', gpaRange: '' });
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-950 transition-all duration-500">
      <AdminHeader
        title="Participant Lists"
        subtitle="Event-based participant registry"
        setIsOpen={setIsSidebarOpen}
        user={user}
      />

      <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-premium overflow-hidden mb-8">
        <div className="px-6 md:px-8 py-7 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Please select which event you want to see participants for</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Events are loaded from the database</p>
        </div>

        <div className="p-6 md:p-8">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
            Event
          </label>
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

      {loadingLists && (
        <div className="py-24 flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-[3px] border-primary-600 border-t-transparent animate-spin"></div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Loading participant lists</span>
        </div>
      )}

      {!loadingLists && listData && (
        <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-premium overflow-hidden">
          <div className="px-6 md:px-8 py-7 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{listData.event.event_name}</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
                {formatDate(listData.event.event_date)} / {listData.event.location}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(listData.tabs || []).map(tab => (
                <button
                  key={tab.type_id}
                  type="button"
                  onClick={() => setActiveTypeId(tab.type_id)}
                  className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                    activeTypeId === tab.type_id
                      ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-slate-100 dark:border-slate-700 hover:border-primary-300'
                  }`}
                >
                  {tab.type_name}
                  <span className="ml-2 opacity-80">{tab.participant_count}</span>
                </button>
              ))}
            </div>
          </div>

          {!activeTab ? (
            <div className="py-24 text-center text-sm font-bold text-slate-400">
              No participant categories are assigned to this event yet.
            </div>
          ) : (
            <>
            <form
              onSubmit={applyFilters}
              className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20"
            >
              <div className="flex flex-col xl:flex-row gap-4 xl:items-end">
                <div className="flex-1">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                    Search participants
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      value={searchDraft}
                      onChange={(event) => setSearchDraft(event.target.value)}
                      placeholder="Name, phone number, or email"
                      className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all"
                    />
                    <button
                      type="submit"
                      className="px-5 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                    >
                      Search
                    </button>
                  </div>
                </div>

                {activeTab.supports_gpa_filter && (
                  <div className="xl:w-72">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                      GPA
                    </label>
                    <select
                      value={filters.gpaRange}
                      onChange={(event) => updateGpaFilter(event.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all"
                    >
                      <option value="">All GPA ranges</option>
                      {(listData.gpaFilters || []).map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(filters.search || filters.gpaRange) && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 text-[11px] font-black uppercase tracking-widest hover:text-rose-600 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/40">
                    <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Name</th>
                    <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Email</th>
                    <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Phone</th>
                    <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role</th>
                    <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(activeTab.participants || []).length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-20 text-center text-sm font-bold text-slate-400">
                        No participants match this database query.
                      </td>
                    </tr>
                  ) : activeTab.participants.map(participant => (
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
                      <td className="px-6 md:px-8 py-5 text-sm font-bold text-slate-500 dark:text-slate-400">
                        {participant.phone || 'Not stored'}
                      </td>
                      <td className="px-6 md:px-8 py-5">
                        <span className="inline-flex px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                          {participant.role}
                        </span>
                      </td>
                      <td className="px-6 md:px-8 py-5 text-sm font-black text-slate-600 dark:text-slate-300">
                        {participant.status || 'Not stored'}
                      </td>
                      <td className="px-6 md:px-8 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedParticipantId(participant.eventparticipant_id)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
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

      <ParticipantDetailsModal
        eventId={selectedEventId}
        participantId={selectedParticipantId}
        onClose={() => setSelectedParticipantId(null)}
      />
    </div>
  );
};

export default ParticipantLists;
