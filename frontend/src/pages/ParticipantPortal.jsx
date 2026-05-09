import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invitationService } from '../services/api';

const formatDateTime = (value) => {
  if (!value) return 'Date and time pending';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const Detail = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-4">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className="text-sm font-black text-slate-900 dark:text-white">{value || 'Not available'}</p>
  </div>
);

const RequestInvitationModal = ({ invitation, onClose, onSubmitted }) => {
  const [formData, setFormData] = useState({
    receiver_type: 'Family',
    receiver_name: '',
    relationship: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!invitation) return null;

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      await invitationService.createMoreInvitationRequest({
        event_id: invitation.event_id,
        ...formData
      });
      onSubmitted?.('Invitation request submitted successfully.');
      onClose();
    } catch (err) {
      setError(err.message || err.error || 'Could not submit invitation request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Request More Invitation</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{invitation.event_name}</p>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500">X</button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          {error && <div className="rounded-2xl bg-rose-50 border border-rose-100 px-5 py-3 text-sm font-bold text-rose-700">{error}</div>}

          <label className="block">
            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Who will receive this invitation?</span>
            <input
              list="receiver-type-options"
              required
              value={formData.receiver_type}
              onChange={(event) => setFormData(current => ({ ...current, receiver_type: event.target.value }))}
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none"
            />
            <datalist id="receiver-type-options">
              <option value="Friend" />
              <option value="Family" />
              <option value="Parent" />
              <option value="Relative" />
            </datalist>
          </label>

          <label className="block">
            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Person Name</span>
            <input
              required
              value={formData.receiver_name}
              onChange={(event) => setFormData(current => ({ ...current, receiver_name: event.target.value }))}
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none"
            />
          </label>

          <label className="block">
            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Relationship</span>
            <input
              required
              value={formData.relationship}
              onChange={(event) => setFormData(current => ({ ...current, relationship: event.target.value }))}
              placeholder="Brother, Friend, Cousin, Parent"
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[11px] font-black uppercase tracking-widest">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-3 rounded-2xl bg-primary-600 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50">
              {saving ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ParticipantPortal = () => {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [invitation, setInvitation] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingInvitation, setLoadingInvitation] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(storedUser));
    let isMounted = true;

    const loadEvents = async () => {
      try {
        setLoadingEvents(true);
        setError('');
        const data = await invitationService.getMyEvents();
        if (!isMounted) return;
        setFullName(data.full_name || JSON.parse(storedUser).username);
        setEvents(data.events || []);
      } catch (err) {
        if (isMounted) setError(err.message || 'Could not load your events');
      } finally {
        if (isMounted) setLoadingEvents(false);
      }
    };

    loadEvents();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!selectedEventId) {
      setInvitation(null);
      return;
    }

    let isMounted = true;
    const loadInvitation = async () => {
      try {
        setLoadingInvitation(true);
        setError('');
        const data = await invitationService.getMyEventInvitation(selectedEventId);
        if (isMounted) setInvitation(data);
      } catch (err) {
        if (isMounted) {
          setInvitation(null);
          setError(err.message || 'Could not load your invitation');
        }
      } finally {
        if (isMounted) setLoadingInvitation(false);
      }
    };

    loadInvitation();
    return () => {
      isMounted = false;
    };
  }, [selectedEventId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary-600">Invitation Portal</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Welcome, {fullName || user?.username || 'Participant'}</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-5 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300 text-[11px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-900/40"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden mb-8">
          <div className="px-6 sm:px-8 py-7 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-black tracking-tight">Select an event to view your invitation</h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2">Only events assigned to your account are shown here.</p>
          </div>
          <div className="p-6 sm:p-8">
            <select
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              disabled={loadingEvents}
              className="w-full max-w-2xl px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all"
            >
              <option value="">{loadingEvents ? 'Loading your events...' : 'Choose an event'}</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.event_name} - {formatDateTime(event.event_date)}
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
          <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-4 text-sm font-bold text-emerald-700">
            {successMessage}
          </div>
        )}

        {loadingInvitation && (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-[3px] border-primary-600 border-t-transparent animate-spin"></div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Loading your invitation</span>
          </div>
        )}

        {invitation && !loadingInvitation && (
          <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden">
            <div className="grid lg:grid-cols-[1fr_360px]">
              <div className="p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary-600 mb-2">Your Invitation</p>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">{invitation.event_name}</h2>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8">{invitation.location || 'Location pending'}</p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Detail label="Date and Time" value={formatDateTime(invitation.event_date)} />
                  <Detail label="Participant Role" value={invitation.invitation_type} />
                  <Detail label="Seat Group" value={invitation.seat_group || 'Not assigned yet'} />
                  <Detail label="Seat Number" value={invitation.seat_number || 'Not assigned yet'} />
                </div>

                <button
                  type="button"
                  onClick={() => setRequestModalOpen(true)}
                  className="mt-8 px-5 py-3 rounded-2xl bg-primary-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-700 transition-colors"
                >
                  Request More Invitation
                </button>
              </div>

              <aside className="p-6 sm:p-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/40">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5">Entrance QR Code</h3>
                {invitation.qr_code ? (
                  <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
                    <img src={invitation.qr_code} alt="Invitation QR code" className="w-60 h-60 object-contain" />
                  </div>
                ) : (
                  <div className="w-60 h-60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-center px-8">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">QR code not generated yet</span>
                  </div>
                )}
              </aside>
            </div>
          </section>
        )}
      </main>

      <RequestInvitationModal
        invitation={requestModalOpen ? invitation : null}
        onClose={() => setRequestModalOpen(false)}
        onSubmitted={(nextMessage) => setSuccessMessage(nextMessage)}
      />
    </div>
  );
};

export default ParticipantPortal;
