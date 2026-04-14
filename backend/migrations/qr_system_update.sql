-- Migration to update invitations system
BEGIN;

-- 1. Create invitation_scans table
CREATE TABLE IF NOT EXISTS invitation_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL, -- 'SUCCESS', 'FAILED_USED', 'FAILED_INVALID'
    device_info TEXT, -- optional
    ip_address VARCHAR(45) -- optional
);

-- 2. Add indexes for faster scanning
CREATE INDEX IF NOT EXISTS idx_invitation_scans_invitation_id ON invitation_scans(invitation_id);

-- 3. Update invitation_batches to include progress tracking
ALTER TABLE invitation_batches ADD COLUMN IF NOT EXISTS total_count INTEGER DEFAULT 0;
ALTER TABLE invitation_batches ADD COLUMN IF NOT EXISTS processed_count INTEGER DEFAULT 0;
ALTER TABLE invitation_batches ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 4. Clean up or adjust invitations table
-- Instead of deleting, we'll ADD the required columns to the existing table to maintain any existing data
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS eventparticipant_id INTEGER REFERENCES event_participants(eventparticipant_id) ON DELETE CASCADE;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS seat_group_id UUID REFERENCES seat_groups(id) ON DELETE CASCADE;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS comm_status VARCHAR(20) DEFAULT 'PENDING'; -- PENDING, SENT, FAILED

-- 5. Add index for qr_token lookup
CREATE INDEX IF NOT EXISTS idx_invitations_qr_token ON invitations(qr_token);

COMMIT;
