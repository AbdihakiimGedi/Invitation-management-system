import React, { useEffect, useMemo, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import { invitationService } from '../services/api';

const formatDate = (value) => {
  if (!value) return 'Date pending';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const SentInvitations = ({ user, setIsSidebarOpen }) => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [capacity, setCapacity] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      try {
        setLoadingEvents(true);
        setError('');
        const data = await invitationService.getManagementEvents();
        if (isMounted) setEvents(data || []);
      } catch (err) {
        if (isMounted) setError(err.message || err.error || 'Could not load events');
      } finally {
        if (isMounted) setLoadingEvents(false);
      }
    };
    loadEvents();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setParticipants([]);
      setCapacity(null);
      return;
    }

    let isMounted = true;
    const loadParticipants = async () => {
      try {
        setLoadingParticipants(true);
        setError('');
        const data = await invitationService.getSentParticipants(selectedEventId);
        if (!isMounted) return;
        setParticipants(data.participants || []);
        setCapacity(data.capacity || null);
      } catch (err) {
        if (isMounted) setError(err.message || err.error || 'Could not load sent invitations');
      } finally {
        if (isMounted) setLoadingParticipants(false);
      }
    };
    loadParticipants();
    return () => { isMounted = false; };
  }, [selectedEventId, refreshKey]);

  const selectedEvent = useMemo(
    () => events.find(event => event.id === selectedEventId),
    [events, selectedEventId]
  );

  const resend = async (participant) => {
    try {
      setBusyId(participant.eventparticipant_id);
      setError('');
      setMessage('');
      const result = await invitationService.resendParticipantInvitation(selectedEventId, participant.eventparticipant_id);
      if ((result.sent || 0) > 0) {
        setMessage(`Invitation resent to ${participant.full_name}.`);
      } else {
        setMessage(result.reason || 'No invitation was sent for this participant.');
      }
      setRefreshKey(current => current + 1);
    } catch (err) {
      setError(err.message || err.error || 'No invitations remaining for this event. Event capacity is full.');
      if (err.data?.capacity) setCapacity(err.data.capacity);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminHeader title="Sent Invitations" subtitle="Resend invitations with database capacity control" setIsOpen={setIsSidebarOpen} user={user} />

      <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-premium overflow-hidden mb-8">
        <div className="px-6 md:px-8 py-7 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Select Event</h2>
        </div>
        <div className="p-6 md:p-8">
          <select
            value={selectedEventId}
            onChange={(event) => setSelectedEventId(event.target.value)}
            disabled={loadingEvents}
            className="w-full max-w-2xl px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none"
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

      {error && <div className="mb-8 rounded-2xl border border-rose-100 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700">{error}</div>}
      {message && <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-4 text-sm font-bold text-emerald-700">{message}</div>}

      {selectedEventId && (
        <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-premium overflow-hidden">
          <div className="px-6 md:px-8 py-7 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedEvent?.event_name || 'Event Invitations'}</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
                Remaining: {capacity?.remaining_invitations ?? 'Unlimited'} / Capacity: {capacity?.max_capacity ?? 'Unlimited'}
              </p>
            </div>
          </div>

          {loadingParticipants ? (
            <div className="py-20 text-center text-sm font-black text-slate-400 uppercase tracking-widest">Loading invitations</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/40">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Name</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Email</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Invitation Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {participants.length === 0 ? (
                    <tr><td colSpan="5" className="py-20 text-center text-sm font-bold text-slate-400">No participants assigned to this event.</td></tr>
                  ) : participants.map(participant => (
                    <tr key={participant.eventparticipant_id}>
                      <td className="px-6 py-5 text-sm font-black text-slate-900 dark:text-white">{participant.full_name}</td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-500">{participant.role}</td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-500">{participant.email || 'No email stored'}</td>
                      <td className="px-6 py-5 text-sm font-black text-slate-700 dark:text-slate-200">{participant.invitation_status}</td>
                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => resend(participant)}
                          disabled={busyId === participant.eventparticipant_id}
                          className="px-4 py-2.5 rounded-2xl bg-primary-600 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50"
                        >
                          {busyId === participant.eventparticipant_id ? 'Sending...' : 'Resend Invitation'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default SentInvitations;
