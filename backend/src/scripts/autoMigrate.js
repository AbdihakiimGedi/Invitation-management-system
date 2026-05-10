require('dotenv').config();
const db = require('../config/database');

/**
 * Auto-migration script — runs on every backend startup.
 * Uses CREATE TABLE IF NOT EXISTS / CREATE EXTENSION IF NOT EXISTS so it is
 * fully idempotent and safe to run against both fresh and already-initialised
 * databases.  It will never drop or truncate existing data.
 */
async function runMigrations() {
  console.log('[MIGRATE] Starting schema auto-migration...');

  const sql = `
    -- ── Extensions ─────────────────────────────────────────────────────────────
    CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

    -- ── Users ───────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.users (
      id               UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      username         VARCHAR(50)  NOT NULL,
      password_hash    TEXT         NOT NULL,
      role             VARCHAR(20)  NOT NULL,
      is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
      created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      generated_password VARCHAR(150),
      full_name        VARCHAR(150),
      email            VARCHAR(150),
      phone            VARCHAR(50),
      updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT users_username_check CHECK (char_length(username) >= 3),
      CONSTRAINT users_role_check CHECK (role = ANY(ARRAY[
        'Admin','Graduate','Guest','Special Guest',
        'Attendance Staff','Event Staff','VIP Guest'
      ]))
    );

    -- ── Faculties ────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.faculties (
      faculty_id   SERIAL      PRIMARY KEY,
      faculty_name VARCHAR(100) NOT NULL,
      description  TEXT
    );

    -- ── Departments ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.departments (
      department_id   SERIAL       PRIMARY KEY,
      department_name VARCHAR(100) NOT NULL,
      description     TEXT,
      faculty_id      INTEGER      NOT NULL
    );

    -- ── Students ─────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.students (
      student_id    VARCHAR(50) NOT NULL PRIMARY KEY,
      full_name     VARCHAR(100) NOT NULL,
      department_id INTEGER      NOT NULL,
      faculty_id    INTEGER      NOT NULL,
      phone         VARCHAR(50),
      email         VARCHAR(100),
      gpa           NUMERIC(3,2)
    );

    -- ── Student status ───────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.student_status (
      student_id       VARCHAR(50) NOT NULL PRIMARY KEY,
      has_finance_issue BOOLEAN DEFAULT FALSE,
      has_exam_issue    BOOLEAN DEFAULT FALSE
    );

    -- ── Graduates ────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.graduates (
      user_id              UUID        PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
      department_id        UUID,
      student_id           VARCHAR(50) NOT NULL,
      degree_level         VARCHAR(50) NOT NULL,
      gpa                  NUMERIC(4,2),
      academic_percentage  NUMERIC(5,2),
      CONSTRAINT graduates_degree_level_check CHECK (degree_level = ANY(ARRAY['PhD','Master''s','Bachelor''s']))
    );

    -- ── Guests ───────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.guests (
      guest_id   SERIAL       PRIMARY KEY,
      guest_name VARCHAR(100) NOT NULL,
      phone      VARCHAR(50),
      email      VARCHAR(100)
    );

    -- ── People types ─────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.people_types (
      id         UUID      DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      type_name  VARCHAR(50)  NOT NULL,
      table_name VARCHAR(50)  NOT NULL,
      created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Events ───────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.events (
      id           UUID      DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      event_name   VARCHAR(255) NOT NULL,
      description  TEXT,
      event_date   TIMESTAMP    NOT NULL,
      location     VARCHAR(500) NOT NULL,
      status       VARCHAR(20)  NOT NULL DEFAULT 'active',
      max_capacity INTEGER,
      created_by   UUID,
      created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      event_end_date TIMESTAMP,
      CONSTRAINT events_status_check CHECK (status = ANY(ARRAY['active','closed','finished']))
    );

    -- ── Event participants ────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.event_participants (
      eventparticipant_id SERIAL      PRIMARY KEY,
      event_id            UUID        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
      user_id             VARCHAR(50) NOT NULL,
      type_id             UUID        NOT NULL,
      status              VARCHAR(20) NOT NULL,
      reason              TEXT,
      is_participating    BOOLEAN     DEFAULT TRUE,
      guest_ref_id        INTEGER,
      CONSTRAINT event_participants_status_check CHECK (status = ANY(ARRAY['eligible','rejected']))
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'unique_user_event'
          AND conrelid = 'public.event_participants'::regclass
      ) THEN
        IF NOT EXISTS (
          SELECT 1
          FROM public.event_participants
          GROUP BY user_id, event_id
          HAVING COUNT(*) > 1
        ) THEN
          ALTER TABLE public.event_participants
            ADD CONSTRAINT unique_user_event UNIQUE (user_id, event_id);
        ELSE
          RAISE NOTICE 'Skipped unique_user_event constraint because duplicate event_participants rows exist.';
        END IF;
      END IF;
    END $$;

    -- ── Seats ────────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.seats (
      id            UUID      DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      event_id      UUID      REFERENCES public.events(id) ON DELETE CASCADE,
      zone          VARCHAR(50)  NOT NULL,
      section       VARCHAR(50),
      row_number    VARCHAR(10),
      seat_number   VARCHAR(10),
      category_type VARCHAR(30),
      status        VARCHAR(20)  DEFAULT 'Available',
      updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Seat groups ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.seat_groups (
      id          UUID      DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      event_id    UUID      REFERENCES public.events(id) ON DELETE CASCADE,
      name        VARCHAR(100) NOT NULL,
      target_type VARCHAR(20),
      description TEXT,
      created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT seat_groups_target_type_check CHECK (target_type = ANY(ARRAY['Student','Guest','Both']))
    );

    -- ── Seat assignments ─────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.seat_assignments (
      id                  UUID      DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      event_id            UUID      REFERENCES public.events(id) ON DELETE CASCADE,
      seat_group_id       UUID      REFERENCES public.seat_groups(id) ON DELETE CASCADE,
      eventparticipant_id INTEGER,
      created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ── QR codes ─────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.qrcodes (
      id            UUID      DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      code_data     TEXT      NOT NULL UNIQUE,
      security_hash TEXT      NOT NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Invitation templates ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.invitation_templates (
      id                   UUID      DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      event_id             UUID      REFERENCES public.events(id) ON DELETE CASCADE,
      template_name        VARCHAR(100) NOT NULL,
      max_guests_per_student INTEGER DEFAULT 2,
      is_active            BOOLEAN   DEFAULT TRUE,
      created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Invitation batches ───────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.invitation_batches (
      id              UUID      DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      event_id        UUID      REFERENCES public.events(id) ON DELETE CASCADE,
      batch_name      VARCHAR(100) NOT NULL,
      status          VARCHAR(20)  DEFAULT 'Draft',
      created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      sent_at         TIMESTAMP,
      total_count     INTEGER      DEFAULT 0,
      processed_count INTEGER      DEFAULT 0,
      error_message   TEXT,
      qty_per_person  INTEGER      DEFAULT 1
    );

    -- ── Invitations ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.invitations (
      id                  UUID      DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      event_id            UUID      REFERENCES public.events(id) ON DELETE CASCADE,
      batch_id            UUID      REFERENCES public.invitation_batches(id),
      qrcode_id           UUID      REFERENCES public.qrcodes(id),
      seat_id             UUID      REFERENCES public.seats(id),
      attendee_type       VARCHAR(20),
      student_id          VARCHAR(50),
      guest_id            UUID,
      status              VARCHAR(20)  DEFAULT 'Pending',
      created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      eventparticipant_id INTEGER,
      seat_group_id       UUID,
      qr_token            TEXT,
      quantity            INTEGER      DEFAULT 1,
      comm_status         VARCHAR(20)  DEFAULT 'PENDING'
    );

    -- ── Invitation deliveries ────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.invitation_deliveries (
      id                  UUID      DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      event_id            UUID      NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
      invitation_id       UUID      REFERENCES public.invitations(id),
      eventparticipant_id INTEGER,
      delivery_type       VARCHAR(30) NOT NULL DEFAULT 'SEND',
      status              VARCHAR(20) NOT NULL DEFAULT 'SENT',
      sent_at             TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Invitation requests ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.invitation_requests (
      id                           UUID      DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      event_id                     UUID      NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
      requester_user_id            UUID      NOT NULL,
      requester_eventparticipant_id INTEGER,
      receiver_type                VARCHAR(100) NOT NULL,
      receiver_name                VARCHAR(150) NOT NULL,
      relationship                 VARCHAR(100) NOT NULL,
      status                       VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
      admin_message                TEXT,
      approved_eventparticipant_id INTEGER,
      approved_invitation_id       UUID,
      created_at                   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at                   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Invitation scans ─────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.invitation_scans (
      id           UUID      DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      invitation_id UUID     NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
      scanned_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status       VARCHAR(20) NOT NULL,
      device_info  TEXT,
      ip_address   VARCHAR(45)
    );

    -- ── Attendance records ────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.attendance_records (
      id                 UUID      DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      participant_id     INTEGER   NOT NULL,
      invitation_id      UUID      NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
      event_id           UUID      NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
      scanned_by         UUID,
      scanned_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      attendance_status  VARCHAR(30) NOT NULL DEFAULT 'ATTENDED'
    );

    -- ── System roles ─────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.system_roles (
      role_name   VARCHAR(50) NOT NULL PRIMARY KEY,
      description TEXT,
      is_system   BOOLEAN     NOT NULL DEFAULT TRUE,
      created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- ── System activity logs ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.system_activity_logs (
      id          UUID      DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      actor_user_id UUID,
      action_type VARCHAR(80) NOT NULL,
      entity_type VARCHAR(80),
      entity_id   TEXT,
      description TEXT,
      metadata    JSONB       DEFAULT '{}',
      created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Seed: people_types (required for participant assignment) ──────────────────
    INSERT INTO public.people_types (id, type_name, table_name)
    VALUES
      ('9b782a9e-0e17-4c58-a794-5dc33dbf1e3c', 'Graduate', 'students'),
      ('8eda6dba-935b-4b97-b629-f989db5c2428', 'Guest',    'guests'),
      ('33a2c988-e65d-4fa0-b8e9-b1b838106906', 'VIP Guest','guests')
    ON CONFLICT (id) DO NOTHING;

    -- ── Seed: system_roles ────────────────────────────────────────────────────────
    INSERT INTO public.system_roles (role_name, description)
    VALUES
      ('Admin',            'Full system access'),
      ('Graduate',         'Graduating student portal access'),
      ('Guest',            'Guest portal access'),
      ('VIP Guest',        'VIP guest portal access'),
      ('Attendance Staff', 'QR scanner / gate staff'),
      ('Event Staff',      'Event management staff')
    ON CONFLICT (role_name) DO NOTHING;
  `;

  try {
    await db.query(sql);
    console.log('[MIGRATE] ✅ Schema migration completed successfully.');
  } catch (error) {
    console.error('[MIGRATE] ❌ Schema migration failed:', error.message);
    throw error; // Let server startup fail fast with a clear error
  }
}

module.exports = { runMigrations };
