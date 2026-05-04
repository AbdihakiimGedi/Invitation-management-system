const db = require('../config/database');
const fs = require('fs');
const xlsx = require('xlsx');
const EventModel = require('../models/eventModel');
const InvitationService = require('./invitationService');
const InvitationEmailService = require('./invitationEmailService');

const PeopleService = {
  /**
   * Fetches all available people types from the metadata table.
   */
  async getPeopleTypes() {
    const query = 'SELECT * FROM people_types ORDER BY type_name ASC';
    const result = await db.query(query);
    return result.rows;
  },

  /**
   * Dynamically builds a mapping schema from the live database.
   * - Queries information_schema.columns for all importable columns
   * - Detects FK relationships to mark relational fields as 'lookup' type
   * - No column names are hardcoded — 100% schema-driven
   */
  async getMappingSchema(tableName) {
    const key = (tableName || '').toLowerCase();

    // 1. Fetch all columns for the target table (exclude system/auto columns)
    const colResult = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE LOWER(table_name) = $1
        AND table_schema = 'public'
        AND column_name NOT IN ('created_at', 'updated_at')
      ORDER BY ordinal_position
    `, [key]);

    if (colResult.rowCount === 0) {
      if (key === 'guests') {
        return [
          { column: 'guest_name', type: 'direct', label: 'Guest Name', required: true },
          { column: 'phone', type: 'direct', label: 'Phone', required: false },
          { column: 'email', type: 'direct', label: 'Email', required: false },
          { column: 'user_id', type: 'direct', label: 'External ID / Passport', required: false }
        ];
      }
      return [];
    }

    // 2. Fetch FK relationships for this table
    const fkResult = await db.query(`
      SELECT
        kcu.column_name                  AS fk_column,
        ccu.table_name                   AS ref_table,
        ccu.column_name                  AS ref_pk_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND LOWER(tc.table_name) = $1
    `, [key]);

    // Build a map: fk_column -> { ref_table, ref_pk_column }
    const fkMap = {};
    for (const fk of fkResult.rows) {
      fkMap[fk.fk_column] = { refTable: fk.ref_table, refPk: fk.ref_pk_column };
    }

    // 3. For each FK column, find the best "display name" column in the referenced table
    //    (first non-PK VARCHAR/TEXT column — the human-readable label)
    const lookupKeyCache = {};
    for (const fkCol of Object.keys(fkMap)) {
      const { refTable, refPk } = fkMap[fkCol];
      if (lookupKeyCache[refTable]) continue;
      const nameColResult = await db.query(`
        SELECT column_name FROM information_schema.columns
        WHERE LOWER(table_name) = LOWER($1)
          AND table_schema = 'public'
          AND data_type IN ('character varying', 'text')
          AND column_name != $2
        ORDER BY ordinal_position
        LIMIT 1
      `, [refTable, refPk]);
      lookupKeyCache[refTable] = nameColResult.rows[0]?.column_name || null;
    }

    // 4. Dynamic Extension Discovery (1:1 Relationships / Status Tables)
    // Find tables that reference this table where the FK is also their PK
    const extensionsRes = await db.query(`
      SELECT 
          referring_kcu.table_name AS extension_table,
          referring_kcu.column_name AS extension_column
      FROM 
          information_schema.table_constraints AS referring_tc
      JOIN 
          information_schema.key_column_usage AS referring_kcu
          ON referring_tc.constraint_name = referring_kcu.constraint_name
      JOIN 
          information_schema.constraint_column_usage AS target_ccu
          ON target_ccu.constraint_name = referring_tc.constraint_name
      JOIN 
          information_schema.table_constraints AS pk_tc
          ON pk_tc.table_name = referring_kcu.table_name 
          AND pk_tc.constraint_type = 'PRIMARY KEY'
      JOIN 
          information_schema.key_column_usage AS pk_kcu
          ON pk_kcu.constraint_name = pk_tc.constraint_name 
          AND pk_kcu.column_name = referring_kcu.column_name
      WHERE 
          referring_tc.constraint_type = 'FOREIGN KEY'
          AND LOWER(target_ccu.table_name) = $1
    `, [key]);

    const extensionColumns = [];
    for (const ext of extensionsRes.rows) {
      const extColResult = await db.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE LOWER(table_name) = LOWER($1)
          AND table_schema = 'public'
          AND column_name NOT IN ('created_at', 'updated_at', $2)
        ORDER BY ordinal_position
      `, [ext.extension_table, ext.extension_column]);
      
      extColResult.rows.forEach(col => {
        extensionColumns.push({
          column:   col.column_name,
          type:     'direct',
          label:    col.column_name.replace(/^has_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          required: false // Extensions are typically optional
        });
      });
    }

    // 5. Build the final structured schema
    let schema = colResult.rows.map(col => {
      const isRequired = col.is_nullable === 'NO';
      const fk = fkMap[col.column_name];
      if (fk && lookupKeyCache[fk.refTable]) {
        return {
          column:       col.column_name,
          type:         'lookup',
          label:        `${col.column_name.replace(/_/g, ' ')} (from ${fk.refTable})`,
          lookupTable:  fk.refTable,
          lookupKey:    lookupKeyCache[fk.refTable],
          lookupValue:  col.column_name,  // the FK column itself stores the resolved ID
          required:     isRequired
        };
      }
      return {
        column:   col.column_name,
        type:     'direct',
        label:    col.column_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        required: isRequired
      };
    });

    // Append dynamic extension columns
    schema = [...schema, ...extensionColumns];

    // Fallback/Override for Residents of the "Guests" table if dynamic fetch is incomplete
    if (key === 'guests' && schema.length > 0) {
      // Ensure guest_id is excluded from mapping as it's SERIAL
      schema = schema.filter(f => f.column !== 'guest_id');
    }

    return schema;
  },

  /**
   * Flat column list — delegates to getMappingSchema.
   */
  async getTableColumns(tableName) {
    const schema = await this.getMappingSchema(tableName);
    return schema.map(f => f.column);
  },


  /**
   * Parses a file (CSV/XLSX) and extracts the headers.
   */
  async getFileHeaders(filePath) {
    try {
      const workbook = xlsx.readFile(filePath);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      // Get only the first row for headers
      const headers = xlsx.utils.sheet_to_json(worksheet, { header: 1 })[0];
      return headers || [];
    } catch (err) {
      console.error('Failed to parse file headers:', err);
      throw new Error('Could not read file headers');
    }
  },

  /**
   * Internal helper to read file records as JSON
   */
  _readFileAsJson(filePath) {
    const workbook = xlsx.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    return xlsx.utils.sheet_to_json(worksheet);
  },

  /**
   * Generalized import for Attendees (Guests, VIPs, etc.)
   */
  async importPeople(tableName, eventId, mapping, filePath) {
    if (Object.keys(mapping).length === 0) {
      return { count: 0 };
    }

    const results = this._readFileAsJson(filePath);
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      const dbColumns = Object.values(mapping);

      for (const row of results) {
        const columns = [...dbColumns];
        const values = Object.keys(mapping).map(h => row[h]);

        const hasEventIdRows = await client.query(
          "SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name='event_id'",
          [tableName]
        );

        if (hasEventIdRows.rowCount > 0 && !columns.includes('event_id')) {
          columns.push('event_id');
          values.push(eventId);
        }

        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        await client.query(query, values);
      }
      await client.query('COMMIT');
      return { count: results.length, data: results };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Specialized import for Students with Batch Optimization & Duplicate Prevention.
   * Performs 4-pass resolution (Faculties -> Departments -> Students -> Participants).
   */
  async importStudents(eventId, mapping, filePath, confirmCapacity = false) {
    if (Object.keys(mapping).length === 0) {
      return { totalRows: 0, insertedStudents: 0, skippedDuplicates: 0, newFaculties: 0, newDepartments: 0 };
    }

    const rows = this._readFileAsJson(filePath);
    if (!rows.length) return { totalRows: 0, insertedStudents: 0, skippedDuplicates: 0, newFaculties: 0, newDepartments: 0 };

    const client = await db.pool.connect();
    
    // Result counters
    const summary = {
      totalRows: rows.length,
      insertedStudents: 0,
      skippedDuplicates: 0,
      newFaculties: 0,
      newDepartments: 0,
      addedToEvent: 0,
      alreadyInEvent: 0,
      skippedDueToCapacity: 0,
      remainingCapacity: 0
    };

    try {
      await client.query('BEGIN');

      // --- PASS -1: Event Status & Capacity Check ---
      const eventRes = await client.query('SELECT status, max_capacity FROM events WHERE id = $1', [eventId]);
      const event = eventRes.rows[0];
      if (!event) throw new Error('Event not found.');
      if (event.status !== 'active') throw new Error('Sorry, this event is closed.');

      const countRes = await client.query('SELECT COUNT(*) FROM event_participants WHERE event_id = $1', [eventId]);
      const currentCount = parseInt(countRes.rows[0].count, 10);
      const capacityLimit = event.max_capacity || Infinity;
      let remaining = capacityLimit - currentCount;

      // If remaining is 0 or less, we don't throw yet. 
      // We let the pre-flight check or PASS 4 deal with it so the user gets a handled response.

      // --- PASS 0: Setup Mapping Helpers ---
      const getVal = (row, dbColumn) => {
        const excelHeader = Object.keys(mapping).find(k => mapping[k] === dbColumn);
        return excelHeader ? String(row[excelHeader] || '').trim() : undefined;
      };

      // --- NEW: Pre-Flight Capacity Interrupt ---
      const validRowsInFile = rows.filter(r => !!getVal(r, 'student_id')).length;
      if (validRowsInFile > remaining && !confirmCapacity) {
        await client.query('ROLLBACK');
        return { 
          status: 'capacity_exceeded', 
          remainingCapacity: remaining, 
          uploadedCount: validRowsInFile 
        };
      }

      // --- PASS 1: Resolve Faculties ---
      const uniqueFacultyNames = [...new Set(rows.map(r => getVal(r, 'faculty_id')).filter(Boolean))];
      
      const existingFacultiesRes = await client.query(
        'SELECT faculty_id, faculty_name FROM faculties WHERE LOWER(faculty_name) = ANY($1::text[])',
        [uniqueFacultyNames.map(n => n.toLowerCase())]
      );
      
      const facultyCache = {}; // name.toLowerCase() -> id
      existingFacultiesRes.rows.forEach(f => facultyCache[f.faculty_name.toLowerCase()] = f.faculty_id);

      for (const name of uniqueFacultyNames) {
        if (!facultyCache[name.toLowerCase()]) {
          const insFac = await client.query(
            'INSERT INTO faculties (faculty_name) VALUES ($1) RETURNING faculty_id',
            [name]
          );
          facultyCache[name.toLowerCase()] = insFac.rows[0].faculty_id;
          summary.newFaculties++;
        }
      }

      // --- PASS 2: Resolve Departments ---
      const deptPairs = [];
      const deptMap = new Map(); // "deptName|facId" -> true

      rows.forEach(r => {
        const dName = getVal(r, 'department_id');
        const fName = getVal(r, 'faculty_id');
        if (dName && fName) {
          const fId = facultyCache[fName.toLowerCase()];
          const key = `${dName.toLowerCase()}|${fId}`;
          if (!deptMap.has(key)) {
            deptPairs.push({ name: dName, facultyId: fId });
            deptMap.set(key, true);
          }
        }
      });

      const departmentCache = {}; // name.toLowerCase() + facultyId -> id
      for (const pair of deptPairs) {
        const exDept = await client.query(
          'SELECT department_id FROM departments WHERE LOWER(department_name) = LOWER($1) AND faculty_id = $2 LIMIT 1',
          [pair.name, pair.facultyId]
        );
        if (exDept.rowCount > 0) {
          departmentCache[`${pair.name.toLowerCase()}|${pair.facultyId}`] = exDept.rows[0].department_id;
        } else {
          const insDept = await client.query(
            'INSERT INTO departments (department_name, faculty_id) VALUES ($1, $2) RETURNING department_id',
            [pair.name, pair.facultyId]
          );
          departmentCache[`${pair.name.toLowerCase()}|${pair.facultyId}`] = insDept.rows[0].department_id;
          summary.newDepartments++;
        }
      }

      // --- PASS 3 PREP: Get Graduate Type ID ---
      const typeRes = await client.query("SELECT id FROM people_types WHERE type_name = 'Graduates' LIMIT 1");
      const graduateTypeId = typeRes.rows[0]?.id;

      // --- PASS 4 PREP: Strict (EventID AND UserID) Batch Check ---
      const existingParticipantsRes = await client.query(
        'SELECT user_id FROM event_participants WHERE event_id = $1',
        [eventId]
      );
      const idsSet = new Set(existingParticipantsRes.rows.map(p => p.user_id));

      for (const row of rows) {
        const studentId = getVal(row, 'student_id');
        const name      = getVal(row, 'full_name');
        const phone     = getVal(row, 'phone');
        const email     = getVal(row, 'email');
        const gpa       = getVal(row, 'gpa');

        if (!studentId) {
          summary.totalRows--; 
          continue; 
        }

        const fName = getVal(row, 'faculty_id');
        const dName = getVal(row, 'department_id');
        const fId = fName ? facultyCache[fName.toLowerCase()] : null;
        const dId = (dName && fId) ? departmentCache[`${dName.toLowerCase()}|${fId}`] : null;

        // --- AUTO-EXCLUSION DETECTION ---
        const financeIssue = getVal(row, 'has_finance_issue');
        const examIssue = getVal(row, 'has_exam_issue');
        
        // Helper to normalize truthy values from Excel (True, 1, Yes, etc.)
        const isTrue = (val) => {
          if (!val) return false;
          const s = String(val).toLowerCase().trim();
          return s === 'true' || s === '1' || s === 'yes' || s === 'y' || s === 't';
        };

        const hasFinance = isTrue(financeIssue);
        const hasExam = isTrue(examIssue);
        const isRejected = hasFinance || hasExam;
        const rejectionReason = hasFinance ? 'Finance issue' : (hasExam ? 'Exam issue' : null);

        // --- STUDENT UPSERT ---
        const studentRes = await client.query(`
          INSERT INTO students (student_id, full_name, department_id, faculty_id, phone, email, gpa)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (student_id) 
          DO UPDATE SET
            full_name = EXCLUDED.full_name,
            department_id = EXCLUDED.department_id,
            faculty_id = EXCLUDED.faculty_id,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            gpa = EXCLUDED.gpa
          RETURNING (xmax = 0) AS is_new
        `, [studentId, name, dId, fId, phone, email, gpa || null]);

        if (studentRes.rows[0].is_new) {
          summary.insertedStudents++;
        } else {
          summary.skippedDuplicates++;
        }

        // --- STUDENT STATUS UPDATE (AUTO-EXCLUSION) ---
        await client.query(`
          INSERT INTO student_status (student_id, has_finance_issue, has_exam_issue)
          VALUES ($1, $2, $3)
          ON CONFLICT (student_id) 
          DO UPDATE SET 
            has_finance_issue = EXCLUDED.has_finance_issue,
            has_exam_issue = EXCLUDED.has_exam_issue
        `, [studentId, hasFinance, hasExam]);

        // --- PASS 4: Strict Event Participation Duplicate & Capacity Prevention ---
        if (eventId && graduateTypeId) {
          if (idsSet.has(studentId)) {
            summary.alreadyInEvent++;
            
            // Even if already in event, update status if newly detected as rejected
            if (isRejected) {
              await client.query(`
                UPDATE event_participants 
                SET status = 'rejected', reason = $1
                WHERE event_id = $2 AND user_id = $3
              `, [rejectionReason, eventId, studentId]);
            }
          } else {
            // CAPACITY CHECK: Check if we have slots left
            if (summary.addedToEvent < remaining) {
              const status = isRejected ? 'rejected' : 'eligible';
              
              await client.query(`
                INSERT INTO event_participants (event_id, user_id, type_id, status, reason)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (event_id, user_id) 
                DO UPDATE SET status = EXCLUDED.status, reason = EXCLUDED.reason
              `, [eventId, studentId, graduateTypeId, status, rejectionReason]);
              
              summary.addedToEvent++;
              idsSet.add(studentId);
            } else {
              summary.skippedDueToCapacity++;
            }
          }
        }

        // Attach status to the row object for frontend pre-population
        row.is_auto_excluded = isRejected;
        row.exclusion_reason = rejectionReason;
      }

      summary.remainingCapacity = Math.max(0, remaining - summary.addedToEvent);

      await client.query('COMMIT');
      return { ...summary, data: rows };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Batch Import Failure:', err);
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Finalizes participation and updates issues with strict duplication and capacity protection
   */
  async processParticipation(eventId, studentData, exclusions, typeName = 'Graduates') {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // --- Capacity & Status Check ---
      const eventRes = await client.query('SELECT status, max_capacity FROM events WHERE id = $1', [eventId]);
      const event = eventRes.rows[0];
      if (event.status !== 'active') throw new Error('Sorry, this event is closed.');

      const countRes = await client.query('SELECT COUNT(*) FROM event_participants WHERE event_id = $1', [eventId]);
      const currentCount = parseInt(countRes.rows[0].count, 10);
      const capacityLimit = event.max_capacity || Infinity;
      let remaining = capacityLimit - currentCount;

      // Fetch the UUID type_id for the specified type
      const typeRes = await client.query('SELECT id FROM people_types WHERE type_name = $1', [typeName]);
      const typeId = typeRes.rows[0]?.id;
      if (!typeId) {
        throw new Error(`Misconfigured database: Could not find '${typeName}' in people_types.`);
      }

      const isGuest = typeName.toLowerCase().includes('guest');

      // STRICT PROTECTION: Fetch current manifest for the event 
      const currentRes = await client.query('SELECT user_id FROM event_participants WHERE event_id = $1', [eventId]);
      const currentIdsSet = new Set(currentRes.rows.map(r => r.user_id));

      let newlyAdded = 0;

      for (const student of studentData) {
        const studentId = student.student_id;
        
        // --- Skip duplicate participation assignments ---
        if (currentIdsSet.has(studentId)) continue; 

        // Capacity Block
        if (newlyAdded >= remaining) break;

        const exclusion = exclusions.find(e => e.student_id === studentId);
        const guestRefId = isGuest ? parseInt(studentId, 10) : null;

        if (exclusion) {
          // Update student status ONLY for graduates
          if (!isGuest) {
            await client.query(`
              UPDATE student_status 
              SET has_finance_issue = $1, has_exam_issue = $2
              WHERE student_id = $3
            `, [exclusion.reason === 'Finance issue', exclusion.reason === 'Exam issue', studentId]);
          }

          await client.query(`
            INSERT INTO event_participants (event_id, user_id, type_id, status, reason, guest_ref_id)
            VALUES ($1, $2, $3, 'rejected', $4, $5)
            ON CONFLICT (event_id, user_id) 
            DO UPDATE SET status = EXCLUDED.status, reason = EXCLUDED.reason, guest_ref_id = EXCLUDED.guest_ref_id
          `, [eventId, studentId, typeId, exclusion.reason, guestRefId]);
        } else {
          await client.query(`
            INSERT INTO event_participants (event_id, user_id, type_id, status, guest_ref_id)
            VALUES ($1, $2, $3, 'eligible', $4)
            ON CONFLICT (event_id, user_id) 
            DO UPDATE SET status = EXCLUDED.status, guest_ref_id = EXCLUDED.guest_ref_id
          `, [eventId, studentId, typeId, guestRefId]);
        }
        
        currentIdsSet.add(studentId);
        newlyAdded++;
      }

      await client.query('COMMIT');

      // --- NEW: Automatic Invitation Generation (Blocking) ---
      try {
        await InvitationService.autoGenerateForEvent(eventId);
        
        // --- NEW: Automatic Email Dispatch (Non-Blocking / Background) ---
        // We trigger this in the background so the UI doesn't wait for SMTP response
        setImmediate(() => {
          InvitationEmailService.sendInvitations(eventId).catch(err => {
            console.error('[INVITATION-BG] Background email dispatch failed:', err);
          });
        });
      } catch (invErr) {
        console.error('[INVITATION] Automatic invitation generation failed:', invErr);
      }

      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Updates participation status for a specific user in an event. 
   * Uses the Exclusion Registry logic: Atomic UPDATE if exists.
   */
  async updateParticipationStatus(eventId, userId, isParticipating, typeId = null) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Step 1: Check Record Exists
      const existsRes = await client.query(
        'SELECT status FROM event_participants WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
      );

      // --- NEW: Capacity Check if we are re-including ---
      if (isParticipating) {
        const capacityRes = await client.query(`
          SELECT 
            e.max_capacity,
            (SELECT COUNT(*) FROM event_participants WHERE event_id = $1 AND status = 'eligible') as current_count
          FROM events e
          WHERE e.id = $1
        `, [eventId]);
        
        const eventData = capacityRes.rows[0];
        if (eventData && eventData.max_capacity && parseInt(eventData.current_count) >= eventData.max_capacity) {
           throw new Error("Event is already full. No more invitations can be generated.");
        }
      }

      let action = 'none';
      if (existsRes.rowCount > 0) {
        // Step 2: If Exists -> UPDATE
        const newStatus = isParticipating ? 'eligible' : 'rejected';
        await client.query(`
          UPDATE event_participants
          SET is_participating = $1, status = $2, reason = $3
          WHERE user_id = $4 AND event_id = $5
        `, [isParticipating, newStatus, isParticipating ? null : 'Excluded by Admin', userId, eventId]);
        action = 'updated';
      } else {
        // Step 3: If Not Exists -> Insert new record
        let finalTypeId = typeId;
        if (!finalTypeId) {
           const typeRes = await client.query("SELECT id FROM people_types WHERE type_name = 'Graduates'");
           finalTypeId = typeRes.rows[0]?.id;
        }

        if (!finalTypeId) throw new Error("Participant type classification required for initial entry.");

        const status = isParticipating ? 'eligible' : 'rejected';
        await client.query(`
          INSERT INTO event_participants (event_id, user_id, type_id, status, is_participating, reason)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [eventId, userId, finalTypeId, status, isParticipating, isParticipating ? null : 'Excluded by Admin']);
        action = 'inserted';
      }
      
      await client.query('COMMIT');

      // --- NEW: Post-Inclusion Automation Trigger ---
      if (isParticipating) {
        try {
          // 1. Generate invitation (checks for duplicates automatically)
          await InvitationService.autoGenerateForEvent(eventId);
          
          // 2. Dispatch email in background
          setImmediate(() => {
            InvitationEmailService.sendInvitations(eventId).catch(err => {
              console.error('[RE-INCLUDE-BG] Email dispatch failed:', err);
            });
          });
        } catch (invErr) {
          console.error('[RE-INCLUDE] Post-inclusion automation failed:', invErr);
        }
      }

      return { success: true, action };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async transferParticipant({ userId, sourceEventId, targetEventId }) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Validate target event (exists, active, capacity)
      const targetEvent = await EventModel.getById(targetEventId);
      if (!targetEvent) throw new Error('Target event not discovered.');
      if (targetEvent.status !== 'active') throw new Error('Target event is not active for transfers.');

      const currentCountRes = await client.query(
        "SELECT COUNT(*) FROM event_participants WHERE event_id = $1 AND status = 'eligible' AND is_participating = TRUE",
        [targetEventId]
      );
      const currentCount = parseInt(currentCountRes.rows[0].count);
      if (targetEvent.max_capacity && currentCount >= targetEvent.max_capacity) {
        throw new Error('Sorry, target event is at maximum capacity.');
      }

      // 2. Prevent duplicates
      const dupCheck = await client.query(
        'SELECT 1 FROM event_participants WHERE event_id = $1 AND user_id = $2',
        [targetEventId, userId]
      );
      if (dupCheck.rowCount > 0) {
        throw new Error('Participant is already assigned to the target event.');
      }

      // 3. Perform atomic update
      const updateRes = await client.query(
        'UPDATE event_participants SET event_id = $1 WHERE user_id = $2 AND event_id = $3 RETURNING *',
        [targetEventId, userId, sourceEventId]
      );

      if (updateRes.rowCount === 0) {
        throw new Error('Participant was not found in the source event.');
      }

      await client.query('COMMIT');
      return { success: true, targetEventName: targetEvent.event_name };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Search database securely for Participation Filtering step.
   * Maps Guests data to Student schema identifiers gracefully.
   */
  async searchPeoplePreview(searchTerm, typeName = 'graduate') {
    const isGuest = typeName.toLowerCase().includes('guest');
    const term = `%${searchTerm}%`;

    if (isGuest) {
      const query = `
        SELECT guest_id AS student_id, guest_name AS full_name, phone, email 
        FROM guests 
        WHERE guest_name ILIKE $1
        LIMIT 50
      `;
      const result = await db.query(query, [term]);
      return result.rows;
    } else {
      const query = `
        SELECT student_id, full_name, phone, email 
        FROM students 
        WHERE student_id ILIKE $1 OR full_name ILIKE $1
        LIMIT 50
      `;
      const result = await db.query(query, [term]);
      return result.rows;
    }
  },

  /**
   * Specialized import for Guests.
   * Performs dynamic mapping and links records to event participation.
   */
  async importGuests(eventId, mapping, filePath, confirmCapacity = false) {
    if (Object.keys(mapping).length === 0) {
      return { totalRows: 0, insertedGuests: 0, addedToEvent: 0 };
    }

    const rows = this._readFileAsJson(filePath);
    if (!rows.length) return { totalRows: 0, insertedGuests: 0, addedToEvent: 0 };

    const client = await db.pool.connect();
    const summary = {
      totalRows: rows.length,
      insertedGuests: 0,
      addedToEvent: 0,
      alreadyInEvent: 0,
      skippedDueToCapacity: 0,
      remainingCapacity: 0,
      newFaculties: 0, // for UI compatibility
      newDepartments: 0 // for UI compatibility
    };

    try {
      await client.query('BEGIN');

      // 1. Capacity & Status Check
      const eventRes = await client.query('SELECT status, max_capacity FROM events WHERE id = $1', [eventId]);
      const event = eventRes.rows[0];
      if (!event) throw new Error('Event not found.');
      if (event.status !== 'active') throw new Error('Sorry, this event is closed.');

      const countRes = await client.query('SELECT COUNT(*) FROM event_participants WHERE event_id = $1', [eventId]);
      const currentCount = parseInt(countRes.rows[0].count, 10);
      const capacityLimit = event.max_capacity || Infinity;
      let remaining = capacityLimit - currentCount;

      const getVal = (row, dbColumn) => {
        const excelHeader = Object.keys(mapping).find(k => mapping[k] === dbColumn);
        return excelHeader ? String(row[excelHeader] || '').trim() : undefined;
      };

      // 2. Pre-Flight Capacity Check
      const validRows = rows.filter(r => !!getVal(r, 'guest_name')).length;
      if (validRows > remaining && !confirmCapacity) {
        await client.query('ROLLBACK');
        return { 
          status: 'capacity_exceeded', 
          remainingCapacity: remaining, 
          uploadedCount: validRows 
        };
      }

      // 3. Resolve Guest Type ID
      const typeRes = await client.query("SELECT id FROM people_types WHERE type_name = 'Guests' LIMIT 1");
      const guestTypeId = typeRes.rows[0]?.id;

      // 4. Fetch existing participants
      const currentParticipantsRes = await client.query(
        'SELECT user_id FROM event_participants WHERE event_id = $1',
        [eventId]
      );
      const idsSet = new Set(currentParticipantsRes.rows.map(p => p.user_id));

      for (const row of rows) {
        const name = getVal(row, 'guest_name');
        const phone = getVal(row, 'phone');
        const email = getVal(row, 'email');
        const userIdFromExcel = getVal(row, 'user_id');

        if (!name) {
          summary.totalRows--;
          continue;
        }

        // --- GUEST UPSERT (Approximate by name/phone combinations) ---
        let guestId;
        const existingGuest = await client.query(
          'SELECT guest_id FROM guests WHERE guest_name = $1 AND (phone IS NOT DISTINCT FROM $2 AND email IS NOT DISTINCT FROM $3) LIMIT 1',
          [name, phone || null, email || null]
        );

        if (existingGuest.rowCount > 0) {
          guestId = existingGuest.rows[0].guest_id;
        } else {
          const insRes = await client.query(
            'INSERT INTO guests (guest_name, phone, email) VALUES ($1, $2, $3) RETURNING guest_id',
            [name, phone, email]
          );
          guestId = insRes.rows[0].guest_id;
          summary.insertedGuests++;
        }

        row.guest_id = guestId; // Attach for frontend synchronization

        // --- Participation Link ---
        const finalUserId = userIdFromExcel || String(guestId);
        if (idsSet.has(finalUserId)) {
          summary.alreadyInEvent++;
        } else if (summary.addedToEvent < remaining) {
          await client.query(`
            INSERT INTO event_participants (event_id, user_id, type_id, status, guest_ref_id)
            VALUES ($1, $2, $3, 'eligible', $4)
            ON CONFLICT (event_id, user_id) 
            DO UPDATE SET status = EXCLUDED.status, guest_ref_id = EXCLUDED.guest_ref_id
          `, [eventId, finalUserId, guestTypeId || null, guestId]);
          
          summary.addedToEvent++;
          idsSet.add(finalUserId);
        } else {
          summary.skippedDueToCapacity++;
        }
      }

      summary.remainingCapacity = Math.max(0, remaining - summary.addedToEvent);
      await client.query('COMMIT');
      return { ...summary, data: rows };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

module.exports = PeopleService;
