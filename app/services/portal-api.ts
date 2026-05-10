import { adminRequest, ApiRecord } from '@/services/admin-api';

export type PortalEvent = ApiRecord;
export type PortalInvitation = ApiRecord;

export function asRecord(value: unknown): ApiRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as ApiRecord) : {};
}

export function asArray(value: unknown): ApiRecord[] {
  if (Array.isArray(value)) return value as ApiRecord[];
  const record = asRecord(value);
  for (const key of ['items', 'events', 'invitations', 'participants', 'data', 'rows']) {
    if (Array.isArray(record[key])) return record[key] as ApiRecord[];
  }
  return [];
}

export function valueText(value: unknown, fallback = 'Not available') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

export function eventIdOf(event: ApiRecord) {
  return valueText(event.id || event.event_id, '');
}

export function titleOf(record: ApiRecord) {
  return valueText(record.event_name || record.name || record.title, 'Event');
}

export async function loadMyPortalData() {
  const eventsResponse = await adminRequest<ApiRecord | ApiRecord[]>('/api/v1/invitations/my-events');
  let invitationsResponse: ApiRecord[] = [];

  try {
    invitationsResponse = await adminRequest<ApiRecord[]>('/api/v1/invitations/my-invitations');
  } catch (error) {
    console.log('[Portal API] Invitations endpoint unavailable:', error);
  }

  const eventsRecord = asRecord(eventsResponse);
  return {
    fullName: valueText(eventsRecord.full_name, ''),
    events: asArray(eventsResponse),
    invitations: asArray(invitationsResponse),
  };
}

export async function loadInvitationForEvent(eventId: string) {
  return adminRequest<PortalInvitation>(`/api/v1/invitations/my-events/${eventId}/invitation`);
}

export async function requestMoreInvitation(body: {
  event_id: string;
  receiver_type: string;
  receiver_name: string;
  relationship: string;
}) {
  return adminRequest<ApiRecord>('/api/v1/invitations/requests', {
    method: 'POST',
    body,
  });
}
