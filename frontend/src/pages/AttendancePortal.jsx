import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { attendanceService } from '../services/api';

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const Detail = ({ label, value }) => (
  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className="text-sm font-black text-slate-900 dark:text-white">{value || 'Not available'}</p>
  </div>
);

const ReportTable = ({ rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead className="bg-slate-50 dark:bg-slate-800/40">
        <tr>
          <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Name</th>
          <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Type</th>
          <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Email</th>
          <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Seat Group</th>
          <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Invitation</th>
          <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Attendance</th>
          <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Scan Time</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {rows.length === 0 ? (
          <tr><td colSpan="7" className="py-14 text-center text-sm font-bold text-slate-400">No records found.</td></tr>
        ) : rows.map((row, index) => (
          <tr key={`${row.eventparticipant_id}-${row.invitation_id || index}`}>
            <td className="px-5 py-4 text-sm font-black text-slate-900 dark:text-white">{row.full_name}</td>
            <td className="px-5 py-4 text-sm font-bold text-slate-500">{row.participant_type}</td>
            <td className="px-5 py-4 text-sm font-bold text-slate-500">{row.email || 'No email'}</td>
            <td className="px-5 py-4 text-sm font-bold text-slate-500">{row.seat_group || 'Not assigned'}</td>
            <td className="px-5 py-4 text-sm font-black text-slate-700 dark:text-slate-200">{row.invitation_status || 'NO_INVITATION'}</td>
            <td className="px-5 py-4 text-sm font-black text-slate-700 dark:text-slate-200">{row.attendance_status}</td>
            <td className="px-5 py-4 text-sm font-bold text-slate-500">{row.scanned_at ? formatDateTime(row.scanned_at) : '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AttendancePortal = () => {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [pendingScan, setPendingScan] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [activeList, setActiveList] = useState('attended_participants');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingScan, setLoadingScan] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      try {
        setLoadingEvents(true);
        setError('');
        const data = await attendanceService.getEvents();
        if (isMounted) setEvents(data || []);
      } catch (err) {
        if (isMounted) setError(err.message || err.error || 'Could not load active events');
      } finally {
        if (isMounted) setLoadingEvents(false);
      }
    };
    loadEvents();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setAttendanceList([]);
      setDashboard(null);
      return;
    }
    let isMounted = true;
    const loadReports = async () => {
      try {
        setLoadingReports(true);
        setError('');
        const [listData, dashboardData] = await Promise.all([
          attendanceService.getAttendanceList(selectedEventId),
          attendanceService.getDashboard(selectedEventId)
        ]);
        if (!isMounted) return;
        setAttendanceList(listData || []);
        setDashboard(dashboardData);
      } catch (err) {
        if (isMounted) setError(err.message || err.error || 'Could not load attendance reports');
      } finally {
        if (isMounted) setLoadingReports(false);
      }
    };
    loadReports();
    return () => { isMounted = false; };
  }, [selectedEventId, refreshKey]);

  const selectedEvent = useMemo(
    () => events.find(event => event.id === selectedEventId),
    [events, selectedEventId]
  );

  const validateScan = async (event) => {
    event.preventDefault();
    if (!selectedEventId || !qrToken.trim()) return;
    try {
      setLoadingScan(true);
      setError('');
      setMessage('');
      const data = await attendanceService.validateScan(selectedEventId, qrToken.trim());
      setPendingScan(data);
    } catch (err) {
      setPendingScan(null);
      setError(err.message || err.error || 'Invalid Invitation QR Code');
    } finally {
      setLoadingScan(false);
    }
  };

  const confirmAttendance = async () => {
    try {
      setLoadingScan(true);
      setError('');
      const result = await attendanceService.confirmAttendance(selectedEventId, qrToken.trim());
      setMessage(result.message || 'Eligible Attended Successfully');
      setPendingScan(null);
      setQrToken('');
      setRefreshKey(current => current + 1);
    } catch (err) {
      setError(err.message || err.error || 'Participant Already Attended');
    } finally {
      setLoadingScan(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const lists = dashboard?.lists || {};
  const reportRows = lists[activeList] || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary-600">Attendance Portal</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">QR Attendance Scanner</h1>
            <p className="text-xs font-bold text-slate-400 mt-1">{user?.username || 'Attendance Staff'}</p>
          </div>
          <button onClick={logout} className="px-5 py-3 rounded-2xl bg-rose-50 text-rose-600 text-[11px] font-black uppercase tracking-widest border border-rose-100">
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-10 space-y-8">
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden">
          <div className="px-6 sm:px-8 py-7 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-black tracking-tight">Select Event</h2>
          </div>
          <div className="p-6 sm:p-8">
            <select
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              disabled={loadingEvents}
              className="w-full max-w-2xl px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none"
            >
              <option value="">{loadingEvents ? 'Loading active events...' : 'Select an event'}</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.event_name} - {formatDateTime(event.event_date)}
                </option>
              ))}
            </select>
          </div>
        </section>

        {error && <div className="rounded-2xl border border-rose-100 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700">{error}</div>}
        {message && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-4 text-sm font-bold text-emerald-700">{message}</div>}

        {selectedEventId && (
          <>
            <section className="grid lg:grid-cols-[420px_1fr] gap-8">
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-premium p-6 sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600 mb-2">Selected Event</p>
                <h2 className="text-2xl font-black mb-6">{selectedEvent?.event_name || 'Event'}</h2>
                <form onSubmit={validateScan} className="space-y-4">
                  <label className="block">
                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">QR Code Token</span>
                    <input
                      autoFocus
                      value={qrToken}
                      onChange={(event) => setQrToken(event.target.value)}
                      placeholder="Scan or paste QR token"
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={loadingScan || !qrToken.trim()}
                    className="w-full px-5 py-4 rounded-2xl bg-primary-600 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    {loadingScan ? 'Validating...' : 'Validate QR'}
                  </button>
                </form>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden">
                <div className="px-6 sm:px-8 py-7 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-black tracking-tight">Attendance Dashboard</h2>
                </div>
                <div className="p-6 sm:p-8">
                  {loadingReports ? (
                    <div className="py-12 text-center text-sm font-black text-slate-400 uppercase tracking-widest">Loading dashboard</div>
                  ) : (
                    <div className="grid sm:grid-cols-4 gap-4">
                      <Detail label="Total Attended" value={dashboard?.metrics?.total_attended ?? 0} />
                      <Detail label="Not Attended With Invitations" value={dashboard?.metrics?.not_attended_with_invitations ?? 0} />
                      <Detail label="No Invitation" value={dashboard?.metrics?.not_attended_without_invitations ?? 0} />
                      <Detail label="Invitations" value={dashboard?.metrics?.total_with_invitations ?? 0} />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden">
              <div className="px-6 sm:px-8 py-7 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-black tracking-tight">Attendance List</h2>
              </div>
              <ReportTable rows={attendanceList.map(row => ({
                ...row,
                eventparticipant_id: row.participant_id,
                invitation_status: 'HAS_INVITATION'
              }))} />
            </section>

            <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden">
              <div className="px-6 sm:px-8 py-7 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-black tracking-tight">Detailed Reports</h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  {[
                    ['attended_participants', 'Attended'],
                    ['not_attended_participants', 'Not Attended'],
                    ['participants_with_invitations', 'With Invitations'],
                    ['participants_without_invitations', 'Without Invitations']
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveList(key)}
                      className={`px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border ${
                        activeList === key
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <ReportTable rows={reportRows} />
            </section>
          </>
        )}
      </main>

      {pendingScan && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-6 sm:px-8 py-7 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-black text-emerald-600">Eligible Attended Successfully</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Confirm to save attendance</p>
            </div>
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <Detail label="Full Name" value={pendingScan.full_name} />
                <Detail label="Participant Type" value={pendingScan.participant_type} />
                <Detail label="Seat Group" value={pendingScan.seat_group || 'Not assigned'} />
                <Detail label="Event Name" value={pendingScan.event_name} />
                <Detail label="Invitation Status" value={pendingScan.invitation_status} />
                <Detail label="Seat Number" value={pendingScan.seat_number || 'Not assigned'} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setPendingScan(null)} className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[11px] font-black uppercase tracking-widest">Cancel</button>
                <button type="button" onClick={confirmAttendance} disabled={loadingScan} className="px-5 py-3 rounded-2xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50">
                  {loadingScan ? 'Saving...' : 'OK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePortal;
