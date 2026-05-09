import React, { useEffect, useMemo, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import { invitationService } from '../services/api';

const formatDateTime = (value) => {
  if (!value) return 'Date pending';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const Detail = ({ label, value }) => (
  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className="text-sm font-black text-slate-900 dark:text-white">{value || 'Not available'}</p>
  </div>
);

const RequestDetailsModal = ({ requestId, onClose, onApproved }) => {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!requestId) return undefined;
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await invitationService.getMoreInvitationRequestDetails(requestId);
        if (isMounted) setRequest(data);
      } catch (err) {
        if (isMounted) setError(err.message || err.error || 'Could not load request');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [requestId]);

  if (!requestId) return null;

  const approve = async () => {
    try {
      setSaving(true);
      setError('');
      const result = await invitationService.approveMoreInvitationRequest(requestId);
      onApproved?.(result.message || 'Invitation request processed.');
      onClose();
    } catch (err) {
      setError(err.message || err.error || 'Could not send invitation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Invitation Request</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Full request details</p>
          </div>
          <button type="button" onClick={onClose} className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500">X</button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm font-black text-slate-400 uppercase tracking-widest">Loading request</div>
        ) : (
          <div className="p-6 md:p-8 space-y-8">
            {error && <div className="rounded-2xl bg-rose-50 border border-rose-100 px-5 py-3 text-sm font-bold text-rose-700">{error}</div>}
            {request && (
              <>
                <section>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Request Sender Details</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Detail label="Full Name" value={request.requester_name} />
                    <Detail label="Role" value={request.requester_role} />
                    <Detail label="Email" value={request.requester_email} />
                    <Detail label="Participant Info" value={request.requester_participant_ref} />
                  </div>
                </section>

                <section>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Requested Invitation Receiver</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Detail label="Name" value={request.receiver_name} />
                    <Detail label="Relationship" value={request.relationship} />
                    <Detail label="Invitation Type" value={request.receiver_type} />
                  </div>
                </section>

                <section>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Request Metadata</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Detail label="Request Date/Time" value={formatDateTime(request.created_at)} />
                    <Detail label="Status" value={request.status} />
                    <Detail label="Event" value={request.event_name} />
                    <Detail label="Event Info" value={`${formatDateTime(request.event_date)} / ${request.location || 'Location pending'}`} />
                  </div>
                </section>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[11px] font-black uppercase tracking-widest">Close</button>
                  <button
                    type="button"
                    onClick={approve}
                    disabled={saving || request.status !== 'PENDING'}
                    className="px-5 py-3 rounded-2xl bg-primary-600 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    {saving ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const InvitationRequests = ({ user, setIsSidebarOpen }) => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [requests, setRequests] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      try {
        setLoadingEvents(true);
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
      setRequests([]);
      return;
    }
    let isMounted = true;
    const loadRequests = async () => {
      try {
        setLoadingRequests(true);
        setError('');
        const data = await invitationService.getMoreInvitationRequests(selectedEventId);
        if (isMounted) setRequests(data || []);
      } catch (err) {
        if (isMounted) setError(err.message || err.error || 'Could not load invitation requests');
      } finally {
        if (isMounted) setLoadingRequests(false);
      }
    };
    loadRequests();
    return () => { isMounted = false; };
  }, [selectedEventId, refreshKey]);

  const selectedEvent = useMemo(
    () => events.find(event => event.id === selectedEventId),
    [events, selectedEventId]
  );

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminHeader title="Invitation Requests" subtitle="Review and approve additional invitation requests" setIsOpen={setIsSidebarOpen} user={user} />

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
              <option key={event.id} value={event.id}>{event.event_name} - {formatDateTime(event.event_date)}</option>
            ))}
          </select>
        </div>
      </section>

      {error && <div className="mb-8 rounded-2xl border border-rose-100 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700">{error}</div>}
      {message && <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-4 text-sm font-bold text-emerald-700">{message}</div>}

      {selectedEventId && (
        <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-premium overflow-hidden">
          <div className="px-6 md:px-8 py-7 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedEvent?.event_name || 'Requests'}</h2>
          </div>

          {loadingRequests ? (
            <div className="py-20 text-center text-sm font-black text-slate-400 uppercase tracking-widest">Loading requests</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/40">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Request Sender</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Requested Person</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Relationship</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Request Date</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {requests.length === 0 ? (
                    <tr><td colSpan="6" className="py-20 text-center text-sm font-bold text-slate-400">No invitation requests for this event.</td></tr>
                  ) : requests.map(request => (
                    <tr key={request.id}>
                      <td className="px-6 py-5 text-sm font-black text-slate-900 dark:text-white">{request.requester_name}</td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-500">{request.receiver_name}</td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-500">{request.relationship}</td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-500">{formatDateTime(request.created_at)}</td>
                      <td className="px-6 py-5 text-sm font-black text-slate-700 dark:text-slate-200">{request.status}</td>
                      <td className="px-6 py-5 text-right">
                        <button type="button" onClick={() => setSelectedRequestId(request.id)} className="px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black uppercase tracking-widest">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <RequestDetailsModal
        requestId={selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
        onApproved={(nextMessage) => {
          setMessage(nextMessage);
          setRefreshKey(current => current + 1);
        }}
      />
    </div>
  );
};

export default InvitationRequests;
