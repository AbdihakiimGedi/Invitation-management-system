ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('Admin', 'Graduate', 'Guest', 'Special Guest', 'Attendance Staff'));

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id INTEGER NOT NULL REFERENCES event_participants(eventparticipant_id) ON DELETE CASCADE,
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  scanned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  scanned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  attendance_status VARCHAR(30) NOT NULL DEFAULT 'ATTENDED',
  UNIQUE (invitation_id),
  UNIQUE (event_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_event_id ON attendance_records(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_participant_id ON attendance_records(participant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_scanned_at ON attendance_records(scanned_at);
