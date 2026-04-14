require('dotenv').config();
const db = require('../config/database');

async function setupPhase2() {
  console.log('--- PHASE II DATABASE SETUP ---');
  
  const sql = `
    -- 1. Graduates Table
    CREATE TABLE IF NOT EXISTS graduates (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        department_id UUID,
        student_id VARCHAR(50) UNIQUE NOT NULL,
        degree_level VARCHAR(20) NOT NULL CHECK (degree_level IN ('PhD', 'Master''s', 'Bachelor''s')),
        gpa DECIMAL(4,2),
        academic_percentage DECIMAL(5,2)
    );

    -- 2. Seats Table
    CREATE TABLE IF NOT EXISTS seats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        zone VARCHAR(50) NOT NULL,
        section VARCHAR(50),
        row_number VARCHAR(10),
        seat_number VARCHAR(10),
        category_type VARCHAR(30),
        status VARCHAR(20) DEFAULT 'Available',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Invitation Templates (Needed for generation settings)
    CREATE TABLE IF NOT EXISTS invitation_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        template_name VARCHAR(100) NOT NULL,
        max_guests_per_student INTEGER DEFAULT 2,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Invitation Batches
    CREATE TABLE IF NOT EXISTS invitation_batches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        batch_name VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'Draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sent_at TIMESTAMP
    );

    -- Ensure sent_at exists if table was created previously without it
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invitation_batches' AND column_name='sent_at') THEN
            ALTER TABLE invitation_batches ADD COLUMN sent_at TIMESTAMP;
        END IF;
    END $$;

    -- 5. QRCodes Table
    CREATE TABLE IF NOT EXISTS qrcodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code_data TEXT NOT NULL UNIQUE,
        security_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Invitations Table
    CREATE TABLE IF NOT EXISTS invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        batch_id UUID REFERENCES invitation_batches(id),
        qrcode_id UUID REFERENCES qrcodes(id),
        seat_id UUID REFERENCES seats(id),
        attendee_type VARCHAR(20),
        student_id VARCHAR(50),
        guest_id UUID NULL,
        status VARCHAR(20) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. Ensure every event has at least one template and at least 150 graduate/guest seats
    INSERT INTO invitation_templates (event_id, template_name, max_guests_per_student)
    SELECT id, 'Default Ceremony Template', 2
    FROM events
    WHERE NOT EXISTS (SELECT 1 FROM invitation_templates WHERE event_id = events.id);

    -- Advanced Seat Generation: Ensures we have at least 150 Graduate seats per event
    DO $$
    DECLARE
        e_id UUID;
    BEGIN
        FOR e_id IN SELECT id FROM events LOOP
            IF (SELECT COUNT(*) FROM seats WHERE event_id = e_id AND category_type = 'Graduate') < 100 THEN
                INSERT INTO seats (event_id, zone, row_number, seat_number, category_type)
                SELECT e_id, 'A', '1', generate_series(1, 150), 'Graduate';
            END IF;

            IF (SELECT COUNT(*) FROM seats WHERE event_id = e_id AND category_type = 'Guest') < 100 THEN
                INSERT INTO seats (event_id, zone, row_number, seat_number, category_type)
                SELECT e_id, 'B', '1', generate_series(1, 150), 'Guest';
            END IF;
        END LOOP;
    END $$;

    -- 8. Promote Students to Users (if missing) then to Graduates
    -- This ensures we have actual accounts to rank.
    
    -- A. Create missing users for students
    INSERT INTO users (username, password_hash, role)
    SELECT s.student_id, '$2b$10$YourDefaultHashedPasswordHere', 'Graduate'
    FROM students s
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = s.student_id);

    -- B. Link users to graduates table with ranking data
    INSERT INTO graduates (user_id, student_id, degree_level, gpa)
    SELECT u.id, s.student_id, 
           CASE (random()*2)::int WHEN 0 THEN 'Bachelor''s' WHEN 1 THEN 'Master''s' ELSE 'PhD' END,
           (random()*2 + 2)::decimal(4,2)
    FROM students s
    JOIN users u ON s.student_id = u.username
    WHERE NOT EXISTS (SELECT 1 FROM graduates WHERE student_id = s.student_id);
  `;

  try {
    console.log('Executing Schema Repair...');
    await db.query(sql);
    console.log('✅ PHASE II SCHEMA APPLIED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ SETUP FAILED:', error.message);
    process.exit(1);
  }
}

setupPhase2();
