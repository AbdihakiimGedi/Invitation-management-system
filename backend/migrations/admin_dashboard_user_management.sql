ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

CREATE TABLE IF NOT EXISTS system_roles (
  role_name VARCHAR(50) PRIMARY KEY,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_roles (role_name, description) VALUES
  ('Admin', 'Full system administration'),
  ('Attendance Staff', 'QR scanning and attendance reporting'),
  ('Event Staff', 'Event operations staff'),
  ('Graduate', 'Graduate participant portal'),
  ('Guest', 'Guest participant portal'),
  ('Special Guest', 'VIP guest participant portal')
ON CONFLICT (role_name) DO UPDATE SET description = EXCLUDED.description;

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('Admin', 'Graduate', 'Guest', 'Special Guest', 'Attendance Staff', 'Event Staff'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS system_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80),
  entity_id TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_activity_logs_created_at ON system_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_activity_logs_action_type ON system_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
