const db = require('../config/database');

const typeSlugSql = "LOWER(REGEXP_REPLACE(type_name, '[^a-zA-Z0-9]+', '_', 'g'))";
const typeSlugAliases = {
  graduate: ['graduate', 'graduates', 'student', 'students'],
  guest: ['guest', 'guests'],
  vip_guest: ['vip_guest', 'vip_guests', 'vip', 'special_guest', 'special_guests'],
};
const loginUsernameSql = `
  CASE
    WHEN pt.table_name = 'students' THEN ep.user_id
    WHEN LOWER(pt.type_name) LIKE '%vip%' THEN 'VIP-' || ep.user_id
    ELSE 'GUEST-' || ep.user_id
  END
`;

const buildSearchFilter = (search, params) => {
  const cleanSearch = String(search || '').trim();
  if (!cleanSearch) return '';

  params.push(`%${cleanSearch}%`);
  const searchParam = `$${params.length}`;
  return ` AND (
    COALESCE(s.full_name, g.guest_name, ep.user_id) ILIKE ${searchParam}
    OR ep.user_id ILIKE ${searchParam}
    OR (${loginUsernameSql}) ILIKE ${searchParam}
    OR COALESCE(s.student_id, '') ILIKE ${searchParam}
    OR COALESCE(s.email, g.email, '') ILIKE ${searchParam}
  )`;
};

const ParticipantDirectoryModel = {
  normalizeTypeSlug(typeSlug) {
    return String(typeSlug || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  },

  getTypeSlugCandidates(typeSlug) {
    const normalized = this.normalizeTypeSlug(typeSlug);
    const candidates = new Set([normalized]);

    Object.entries(typeSlugAliases).forEach(([canonical, aliases]) => {
      if (canonical === normalized || aliases.includes(normalized)) {
        candidates.add(canonical);
        aliases.forEach((alias) => candidates.add(alias));
      }
    });

    return [...candidates].filter(Boolean);
  },

  async hasColumn(tableName, columnName) {
    const result = await db.query(
      `
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = $1
          AND column_name = $2
        LIMIT 1
      `,
      [tableName, columnName]
    );
    return result.rowCount > 0;
  },

  async hasTable(tableName, client = db) {
    const result = await client.query('SELECT to_regclass($1) AS table_name', [tableName]);
    return Boolean(result.rows[0]?.table_name);
  },

  async updateColumnReferenceIfExists(client, tableName, columnName, nextValue, currentValue) {
    const tableExists = await this.hasTable(tableName, client);
    if (!tableExists) return;

    const columnExists = await client.query(
      `
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = $1
          AND column_name = $2
        LIMIT 1
      `,
      [tableName, columnName]
    );
    if (columnExists.rowCount === 0) return;

    await client.query(
      `UPDATE ${tableName} SET ${columnName} = $1 WHERE ${columnName} = $2`,
      [nextValue, currentValue]
    );
  },

  async ensureCredentialDisplayColumn() {
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS generated_password VARCHAR(150)');
    await db.query('ALTER TABLE users ALTER COLUMN generated_password TYPE VARCHAR(150)');
  },

  async getTypeBySlug(typeSlug) {
    const slugCandidates = this.getTypeSlugCandidates(typeSlug);
    const query = `
      SELECT
        id,
        type_name,
        table_name,
        ${typeSlugSql} AS type_key
      FROM people_types
      WHERE ${typeSlugSql} = ANY($1::text[])
      LIMIT 1
    `;
    const result = await db.query(query, [slugCandidates]);
    return result.rows[0];
  },

  async getEventsForType(typeId) {
    const hasEventEndDate = await this.hasColumn('events', 'event_end_date');
    const endDateSql = hasEventEndDate ? 'COALESCE(e.event_end_date, e.event_date)' : 'e.event_date';
    const query = `
      SELECT e.*
      FROM events e
      WHERE (${endDateSql})::date >= CURRENT_DATE
        AND EXISTS (
          SELECT 1
          FROM event_participants ep
          WHERE ep.event_id = e.id
            AND ep.type_id = $1
            AND ep.status = 'eligible'
        )
      ORDER BY e.event_date ASC
    `;
    const result = await db.query(query, [typeId]);
    return result.rows;
  },

  async getSwitchableTypes(tableName) {
    const query = `
      SELECT
        id,
        type_name,
        table_name,
        ${typeSlugSql} AS type_key
      FROM people_types
      WHERE table_name = $1
      ORDER BY type_name ASC
    `;
    const result = await db.query(query, [tableName]);
    return result.rows;
  },

  async getParticipants(eventId, typeId, filters = {}) {
    const params = [eventId, typeId];
    const searchSql = buildSearchFilter(filters.search, params);
    const query = `
      SELECT
        ep.eventparticipant_id,
        ${loginUsernameSql} AS username,
        ep.user_id AS participant_ref,
        ep.status,
        ep.reason,
        pt.type_name AS role,
        pt.table_name,
        COALESCE(s.full_name, g.guest_name, ep.user_id) AS full_name,
        COALESCE(s.email, g.email) AS email,
        COALESCE(s.phone, g.phone) AS phone,
        s.student_id,
        s.gpa,
        u.id AS auth_user_id,
        CASE WHEN u.id IS NULL THEN FALSE ELSE TRUE END AS has_login
      FROM event_participants ep
      JOIN people_types pt ON ep.type_id = pt.id
      LEFT JOIN students s
        ON pt.table_name = 'students'
       AND ep.user_id = s.student_id
      LEFT JOIN guests g
        ON pt.table_name = 'guests'
       AND ep.guest_ref_id = g.guest_id
      LEFT JOIN users u ON u.username = (${loginUsernameSql})
      WHERE ep.event_id = $1
        AND ep.type_id = $2
        AND ep.status = 'eligible'
        ${searchSql}
      ORDER BY COALESCE(s.full_name, g.guest_name, ep.user_id) ASC
    `;
    const result = await db.query(query, params);
    return result.rows;
  },

  async getParticipantDetails(eventId, typeId, eventParticipantId, client = db) {
    const typeFilterSql = typeId ? 'AND ep.type_id = $2' : '';
    const params = typeId
      ? [eventId, typeId, eventParticipantId]
      : [eventId, eventParticipantId];
    const eventParticipantParam = typeId ? '$3' : '$2';
    const query = `
      SELECT
        ep.eventparticipant_id,
        ${loginUsernameSql} AS username,
        ep.user_id AS participant_ref,
        ep.status,
        ep.reason,
        ep.guest_ref_id,
        e.event_name,
        e.event_date,
        e.location,
        e.status AS event_status,
        pt.id AS type_id,
        pt.type_name AS role,
        pt.table_name,
        COALESCE(s.full_name, g.guest_name, ep.user_id) AS full_name,
        COALESCE(s.email, g.email) AS email,
        COALESCE(s.phone, g.phone) AS phone,
        s.student_id,
        s.gpa,
        f.faculty_id,
        f.faculty_name,
        d.department_id,
        d.department_name,
        g.guest_id,
        u.id AS auth_user_id,
        CASE WHEN u.id IS NULL THEN FALSE ELSE TRUE END AS has_login,
        CASE
          WHEN pt.table_name = 'students' THEN jsonb_build_array(
            jsonb_build_object('name', 'student_id', 'label', 'Student ID', 'type', 'text', 'required', true),
            jsonb_build_object('name', 'full_name', 'label', 'Full Name', 'type', 'text', 'required', true),
            jsonb_build_object('name', 'email', 'label', 'Email', 'type', 'email', 'required', false),
            jsonb_build_object('name', 'phone', 'label', 'Phone Number', 'type', 'text', 'required', false),
            jsonb_build_object('name', 'gpa', 'label', 'GPA', 'type', 'number', 'required', false),
            jsonb_build_object('name', 'faculty_name', 'label', 'Faculty', 'type', 'text', 'required', false),
            jsonb_build_object('name', 'department_name', 'label', 'Department', 'type', 'text', 'required', false)
          )
          ELSE jsonb_build_array(
            jsonb_build_object(
              'name', 'type_id',
              'label', 'Participant Type',
              'type', 'select',
              'required', true,
              'options', (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                  'value', switch_pt.id,
                  'label', switch_pt.type_name
                ) ORDER BY switch_pt.type_name), '[]'::jsonb)
                FROM people_types switch_pt
                WHERE switch_pt.table_name = pt.table_name
              )
            ),
            jsonb_build_object('name', 'full_name', 'label', 'Full Name', 'type', 'text', 'required', true),
            jsonb_build_object('name', 'email', 'label', 'Email', 'type', 'email', 'required', false),
            jsonb_build_object('name', 'phone', 'label', 'Phone Number', 'type', 'text', 'required', false)
          )
        END AS editable_fields,
        jsonb_strip_nulls(jsonb_build_object(
          'username', ${loginUsernameSql},
          'participant_ref', ep.user_id,
          'student_id', s.student_id,
          'guest_id', g.guest_id,
          'phone', COALESCE(s.phone, g.phone),
          'faculty_id', f.faculty_id,
          'faculty', f.faculty_name,
          'department_id', d.department_id,
          'department', d.department_name,
          'gpa', s.gpa,
          'participant_status', ep.status,
          'status_reason', ep.reason,
          'event_status', e.status
        )) AS metadata
      FROM event_participants ep
      JOIN events e ON e.id = ep.event_id
      JOIN people_types pt ON ep.type_id = pt.id
      LEFT JOIN students s
        ON pt.table_name = 'students'
       AND ep.user_id = s.student_id
      LEFT JOIN faculties f ON s.faculty_id = f.faculty_id
      LEFT JOIN departments d ON s.department_id = d.department_id
      LEFT JOIN guests g
        ON pt.table_name = 'guests'
       AND ep.guest_ref_id = g.guest_id
      LEFT JOIN users u ON u.username = (${loginUsernameSql})
      WHERE ep.event_id = $1
        ${typeFilterSql}
        AND ep.eventparticipant_id = ${eventParticipantParam}
        AND ep.status = 'eligible'
      LIMIT 1
    `;
    const result = await client.query(query, params);
    return result.rows[0];
  },

  async updateParticipantProfile(eventId, typeId, eventParticipantId, updates) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const current = await this.getParticipantDetails(eventId, typeId, eventParticipantId, client);
      if (!current) {
        await client.query('ROLLBACK');
        return null;
      }

      const fields = Array.isArray(current.editable_fields) ? current.editable_fields : [];
      const allowed = new Set(fields.map(field => field.name));
      const updatePairs = Object.entries(updates || {})
        .filter(([key]) => allowed.has(key));

      if (updatePairs.length === 0) {
        await client.query('COMMIT');
        return { before: current, after: current, emailChanged: false, typeChanged: false };
      }

      const tableName = current.table_name;
      const updateMap = new Map(updatePairs);
      const requestedTypeId = updateMap.get('type_id');
      let nextTypeId = current.type_id;

      if (tableName !== 'students' && requestedTypeId && requestedTypeId !== current.type_id) {
        const typeResult = await client.query(
          'SELECT id, table_name FROM people_types WHERE id = $1 LIMIT 1',
          [requestedTypeId]
        );
        const targetType = typeResult.rows[0];
        if (!targetType || targetType.table_name !== tableName) {
          throw new Error('Selected participant type is not valid for this participant');
        }
        nextTypeId = requestedTypeId;
        await client.query(
          'UPDATE event_participants SET type_id = $1 WHERE eventparticipant_id = $2 AND event_id = $3',
          [nextTypeId, eventParticipantId, eventId]
        );
      }

      if (tableName === 'students') {
        const nextStudentId = updateMap.has('student_id')
          ? String(updateMap.get('student_id') || '').trim()
          : current.student_id;
        if (!nextStudentId) {
          throw new Error('Student ID is required');
        }

        let nextFacultyId = null;
        if (updateMap.has('faculty_name')) {
          const facultyName = String(updateMap.get('faculty_name') || '').trim();
          if (facultyName) {
            const existingFaculty = await client.query(
              'SELECT faculty_id FROM faculties WHERE LOWER(faculty_name) = LOWER($1) LIMIT 1',
              [facultyName]
            );
            if (existingFaculty.rows[0]) {
              nextFacultyId = existingFaculty.rows[0].faculty_id;
            } else {
              const facultyResult = await client.query(
                'INSERT INTO faculties (faculty_name) VALUES ($1) RETURNING faculty_id',
                [facultyName]
              );
              nextFacultyId = facultyResult.rows[0].faculty_id;
            }
          }
        }

        let nextDepartmentId = null;
        if (updateMap.has('department_name')) {
          const departmentName = String(updateMap.get('department_name') || '').trim();
          if (departmentName) {
            const departmentResult = await client.query(
              `
                SELECT department_id
                FROM departments
                WHERE LOWER(department_name) = LOWER($1)
                  AND ($2::int IS NULL OR faculty_id = $2)
                LIMIT 1
              `,
              [departmentName, nextFacultyId]
            );
            if (departmentResult.rows[0]) {
              nextDepartmentId = departmentResult.rows[0].department_id;
            } else {
              const fallbackFacultyId = nextFacultyId || current.metadata?.faculty_id || current.faculty_id;
              if (!fallbackFacultyId) {
                throw new Error('Faculty is required before creating a department');
              }
              const insertedDepartment = await client.query(
                'INSERT INTO departments (department_name, faculty_id) VALUES ($1, $2) RETURNING department_id',
                [departmentName, fallbackFacultyId]
              );
              nextDepartmentId = insertedDepartment.rows[0].department_id;
            }
          }
        }

        if (nextStudentId !== current.student_id) {
          const duplicateStudent = await client.query(
            'SELECT 1 FROM students WHERE student_id = $1 LIMIT 1',
            [nextStudentId]
          );
          if (duplicateStudent.rowCount > 0) {
            throw new Error('Student ID already exists');
          }

          const nextFullName = updateMap.has('full_name') ? updateMap.get('full_name') : current.full_name;
          const nextEmail = updateMap.has('email') ? updateMap.get('email') : current.email;
          const nextPhone = updateMap.has('phone') ? updateMap.get('phone') : current.phone;
          const nextGpa = updateMap.has('gpa') ? updateMap.get('gpa') : current.gpa;
          const finalFacultyId = nextFacultyId || current.faculty_id;
          const finalDepartmentId = nextDepartmentId || current.department_id;

          await client.query(
            `
              INSERT INTO students (student_id, full_name, department_id, faculty_id, phone, email, gpa)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
              nextStudentId,
              nextFullName,
              finalDepartmentId,
              finalFacultyId,
              nextPhone === '' ? null : nextPhone,
              nextEmail === '' ? null : nextEmail,
              nextGpa === '' ? null : nextGpa
            ]
          );

          await client.query(
            'UPDATE event_participants SET user_id = $1 WHERE eventparticipant_id = $2 AND event_id = $3',
            [nextStudentId, eventParticipantId, eventId]
          );

          const historicalRefs = await client.query(
            'SELECT 1 FROM event_participants WHERE user_id = $1 AND NOT (eventparticipant_id = $2 AND event_id = $3) LIMIT 1',
            [current.student_id, eventParticipantId, eventId]
          );

          if (historicalRefs.rowCount === 0) {
            await this.updateColumnReferenceIfExists(client, 'student_status', 'student_id', nextStudentId, current.student_id);
            await this.updateColumnReferenceIfExists(client, 'invitations', 'student_id', nextStudentId, current.student_id);
            await this.updateColumnReferenceIfExists(client, 'parents_guests', 'student_id', nextStudentId, current.student_id);
            await client.query(
              'UPDATE users SET username = $1 WHERE username = $2',
              [nextStudentId, current.username]
            );
          }
        } else {
          const setClauses = [];
          const params = [];
          const studentColumns = {
            full_name: updateMap.has('full_name') ? updateMap.get('full_name') : undefined,
            email: updateMap.has('email') ? updateMap.get('email') : undefined,
            phone: updateMap.has('phone') ? updateMap.get('phone') : undefined,
            gpa: updateMap.has('gpa') ? updateMap.get('gpa') : undefined,
            faculty_id: nextFacultyId,
            department_id: nextDepartmentId
          };

          Object.entries(studentColumns).forEach(([column, rawValue]) => {
            if (rawValue === undefined || rawValue === null) return;
            params.push(rawValue === '' ? null : rawValue);
            setClauses.push(`${column} = $${params.length}`);
          });

          if (setClauses.length > 0) {
            params.push(current.student_id);
            await client.query(
              `UPDATE students SET ${setClauses.join(', ')} WHERE student_id = $${params.length}`,
              params
            );
          }
        }
      } else {
        const columnMap = { full_name: 'guest_name', email: 'email', phone: 'phone' };
        const setClauses = [];
        const params = [];
        for (const [field, rawValue] of updatePairs) {
          const column = columnMap[field];
          if (!column) continue;
          params.push(rawValue === '' ? null : rawValue);
          setClauses.push(`${column} = $${params.length}`);
        }

        if (setClauses.length > 0) {
          params.push(current.guest_id);
          await client.query(
            `UPDATE guests SET ${setClauses.join(', ')} WHERE guest_id = $${params.length}`,
            params
          );
        }
      }

      const after = await this.getParticipantDetails(eventId, null, eventParticipantId, client);
      if (after?.username && after.username !== current.username) {
        const role = after.role.toLowerCase().includes('vip') ? 'Special Guest' : 'Guest';
        await client.query(
          'UPDATE users SET username = $1, role = $2 WHERE username = $3',
          [after.username, role, current.username]
        );
      }

      await client.query('COMMIT');
      return {
        before: current,
        after,
        emailChanged: String(current.email || '') !== String(after.email || ''),
        typeChanged: String(current.type_id) !== String(after.type_id)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async upsertCredentialWithPassword({ username, passwordHash, generatedPassword, role }) {
    await this.ensureCredentialDisplayColumn();
    const query = `
      INSERT INTO users (id, username, password_hash, generated_password, role, is_active)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, TRUE)
      ON CONFLICT (username)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        generated_password = EXCLUDED.generated_password,
        role = EXCLUDED.role,
        is_active = TRUE
      RETURNING id, username, generated_password, role, is_active, created_at
    `;
    const result = await db.query(query, [username, passwordHash, generatedPassword, role]);
    return result.rows[0];
  },

  async getCredential(username) {
    await this.ensureCredentialDisplayColumn();
    const query = `
      SELECT username, generated_password, role, is_active
      FROM users
      WHERE username = $1
      LIMIT 1
    `;
    const result = await db.query(query, [username]);
    return result.rows[0];
  }
};

module.exports = ParticipantDirectoryModel;
