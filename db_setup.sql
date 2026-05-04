-- 1. Create the database (Run this first, then switch to it)
-- CREATE DATABASE digital_invitation_db;

-- 2. Create the Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL CHECK (char_length(username) >= 3),
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Graduate', 'Guest', 'Special Guest')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create helper tables
CREATE TABLE IF NOT EXISTS faculties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID REFERENCES faculties(id),
    name VARCHAR(255) NOT NULL
);

-- 4. Create the Graduates table
CREATE TABLE IF NOT EXISTS graduates (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    student_id VARCHAR(50) UNIQUE NOT NULL,
    degree_level VARCHAR(20) NOT NULL CHECK (degree_level IN ('PhD', 'Master''s', 'Bachelor''s')),
    gpa DECIMAL(4,2),
    academic_percentage DECIMAL(5,2)
);

-- 5. Create the Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    location VARCHAR(500) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'finished')),
    max_capacity INTEGER,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create the Faculties table
CREATE TABLE faculties (
    faculty_id SERIAL PRIMARY KEY,
    faculty_name VARCHAR(100) NOT NULL,
    description TEXT
);

-- 7. Create the Departments table
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    description TEXT,
    faculty_id INT NOT NULL,

    CONSTRAINT fk_department_faculty
        FOREIGN KEY (faculty_id)
        REFERENCES faculties(faculty_id)
        ON DELETE CASCADE
);

-- 8. Create the Seats table
CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    zone VARCHAR(50) NOT NULL,
    section VARCHAR(50),
    row_number VARCHAR(10),
    seat_number VARCHAR(10),
    category_type VARCHAR(30), -- 'Faculty', 'Graduate', 'Guest', 'VIP'
    status VARCHAR(20) DEFAULT 'Available', -- 'Available', 'Occupied', 'Reserved', 'Broken'
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Create the QRCodes table
CREATE TABLE IF NOT EXISTS qrcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_data TEXT NOT NULL UNIQUE,
    security_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Create Invitation Templates (Phase II)
CREATE TABLE IF NOT EXISTS invitation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    template_name VARCHAR(100) NOT NULL,
    max_guests_per_student INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Create Invitation Batches (Phase II)
CREATE TABLE IF NOT EXISTS invitation_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    batch_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'Draft', -- 'Draft', 'Sent', 'Failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP
);

-- 12. Create the Invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    batch_id UUID REFERENCES invitation_batches(id),
    qrcode_id UUID REFERENCES qrcodes(id),
    seat_id UUID REFERENCES seats(id),
    attendee_type VARCHAR(20), -- 'Graduate', 'Guest', 'SpecialGuest'
    student_id VARCHAR(50) REFERENCES students(student_id) NULL,
    guest_id UUID NULL, -- Will link to parents_guests table
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Create the People Types table (for dynamic dropdowns)
CREATE TABLE IF NOT EXISTS people_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_name VARCHAR(50) UNIQUE NOT NULL,
    table_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Create the Students table
CREATE TABLE students (
    student_id VARCHAR(50) PRIMARY KEY,  -- from Excel
    full_name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    faculty_id INT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    gpa DECIMAL(3,2),

    CONSTRAINT fk_department
        FOREIGN KEY (department_id)
        REFERENCES departments(department_id),

    CONSTRAINT fk_faculty
        FOREIGN KEY (faculty_id)
        REFERENCES faculties(faculty_id)
);
-- 13. Create the Student Status table (Normalized)
CREATE TABLE student_status (
    student_id VARCHAR(50) PRIMARY KEY,
    has_finance_issue BOOLEAN DEFAULT FALSE,
    has_exam_issue BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_student_status
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
);
-- 16. Create the Parents/Guests table (Phase II - Refactored)
CREATE TABLE IF NOT EXISTS parents_guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(50) REFERENCES students(student_id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    relation_type VARCHAR(50), -- 'Father', 'Mother', 'Sister', 'Guest'
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Create the Event Participants table
CREATE TABLE event_participants (
    eventparticipant_id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL,
    user_id VARCHAR(50) NOT NULL,  -- student_id or guest_id
    type_id UUID NOT NULL REFERENCES people_types(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('eligible', 'rejected')),
    reason TEXT,
    guest_ref_id INT, -- links to parents_guests table if Guest

    CONSTRAINT fk_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_event_participant
        UNIQUE (event_id, user_id)
);

-- 16. Create seat_groups table
CREATE TABLE IF NOT EXISTS seat_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    target_type VARCHAR(20) CHECK (target_type IN ('Student', 'Guest', 'Both')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 17. Create seat_assignments table
CREATE TABLE IF NOT EXISTS seat_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    seat_group_id UUID REFERENCES seat_groups(id) ON DELETE CASCADE,
    eventparticipant_id INT REFERENCES event_participants(eventparticipant_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Seed initial People Types
INSERT INTO people_types (type_name, table_name) VALUES 
('Graduates', 'students'),
('Guests', 'parents_guests')
ON CONFLICT (type_name) DO UPDATE SET table_name = EXCLUDED.table_name;
