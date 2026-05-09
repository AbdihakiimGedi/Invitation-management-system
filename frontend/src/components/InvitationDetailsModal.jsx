import React, { useEffect, useState } from 'react';
import { invitationService } from '../services/api';

const formatDate = (value) => {
  if (!value) return 'Date pending';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const InvitationDetailsModal = ({ invitationId, onClose }) => {
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!invitationId) return;

    let isMounted = true;
    const loadInvitation = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await invitationService.getMyInvitation(invitationId);
        if (isMounted) setInvitation(data);
      } catch (err) {
        if (isMounted) setError(err.message || 'Could not load invitation');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInvitation();
    return () => {
      isMounted = false;
    };
  }, [invitationId]);

  if (!invitationId) return null;

  const metadataEntries = Object.entries(invitation?.metadata || {})
    .filter(([, value]) => value !== null && value !== undefined && value !== '');

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Invitation Details</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Personal event invitation</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-600 transition-colors flex items-center justify-center"
            aria-label="Close invitation details"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-[3px] border-primary-600 border-t-transparent animate-spin"></div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Loading invitation</span>
          </div>
        ) : error ? (
          <div className="py-24 text-center text-sm font-bold text-rose-600">{error}</div>
        ) : invitation && (
          <div className="grid md:grid-cols-[1fr_340px]">
            <section className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">{invitation.event_name}</h3>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8">
                {formatDate(invitation.event_date)} / {invitation.location || 'Location pending'}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Seat Group</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{invitation.seat_group || 'Not assigned'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Seat</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{invitation.seat_number || 'Not assigned'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Invitation Type</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{invitation.invitation_type}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{invitation.status || 'Pending'}</p>
                </div>
              </div>

              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Assigned Metadata</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {metadataEntries.map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{key.replaceAll('_', ' ')}</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 text-right break-words">{String(value)}</span>
                  </div>
                ))}
              </div>
            </section>

            <aside className="p-6 md:p-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/40">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5">QR Code</h4>
              {invitation.qr_code ? (
                <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
                  <img src={invitation.qr_code} alt="Invitation QR code" className="w-60 h-60 object-contain" />
                </div>
              ) : (
                <div className="w-60 h-60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-center px-8">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">QR not generated yet</span>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationDetailsModal;
