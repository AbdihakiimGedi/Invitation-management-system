CREATE TABLE IF NOT EXISTS invitation_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL,
  eventparticipant_id INTEGER REFERENCES event_participants(eventparticipant_id) ON DELETE SET NULL,
  delivery_type VARCHAR(30) NOT NULL DEFAULT 'SEND',
  status VARCHAR(20) NOT NULL DEFAULT 'SENT',
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invitation_deliveries_event_id ON invitation_deliveries(event_id);
CREATE INDEX IF NOT EXISTS idx_invitation_deliveries_status ON invitation_deliveries(status);

CREATE TABLE IF NOT EXISTS invitation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_eventparticipant_id INTEGER REFERENCES event_participants(eventparticipant_id) ON DELETE SET NULL,
  receiver_type VARCHAR(100) NOT NULL,
  receiver_name VARCHAR(150) NOT NULL,
  relationship VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  admin_message TEXT,
  approved_eventparticipant_id INTEGER REFERENCES event_participants(eventparticipant_id) ON DELETE SET NULL,
  approved_invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invitation_requests_event_id ON invitation_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_invitation_requests_status ON invitation_requests(status);
