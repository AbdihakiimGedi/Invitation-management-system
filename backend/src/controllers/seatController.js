const SeatModel = require('../models/seatModel');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const db = require('../config/database');

const SeatController = {
  // --- Seat Groups ---
  async createGroup(req, res) {
    try {
      const groupData = req.body;
      if (!groupData.event_id || !groupData.name || !groupData.target_type) {
        return sendError(res, 'Missing required group fields', 400);
      }
      const group = await SeatModel.createSeatGroup(groupData);
      return sendSuccess(res, group, 'Seat group created successfully', 201);
    } catch (error) {
      console.error('Create Group Error:', error);
      return sendError(res, 'Failed to create seat group', 500);
    }
  },

  async getGroups(req, res) {
    try {
      const { eventId } = req.params;
      const groups = await SeatModel.getSeatGroupsByEvent(eventId);
      return sendSuccess(res, groups, 'Seat groups retrieved successfully');
    } catch (error) {
      return sendError(res, 'Failed to fetch seat groups', 500);
    }
  },

  async updateGroup(req, res) {
    try {
      const { id } = req.params;
      const group = await SeatModel.updateSeatGroup(id, req.body);
      return sendSuccess(res, group, 'Seat group updated successfully');
    } catch (error) {
      return sendError(res, 'Failed to update seat group', 500);
    }
  },

  async deleteGroup(req, res) {
    try {
      const { id } = req.params;
      await SeatModel.deleteSeatGroup(id);
      return sendSuccess(res, null, 'Seat group deleted successfully');
    } catch (error) {
      return sendError(res, 'Failed to delete seat group', 500);
    }
  },

  // --- Participant Grouping ---
  async getStudentGroups(req, res) {
    try {
      const { eventId } = req.params;
      const groups = await SeatModel.getGroupedStudents(eventId);
      return sendSuccess(res, groups, 'Student groups retrieved successfully');
    } catch (error) {
      console.error('Get Student Groups Error:', error);
      return sendError(res, 'Failed to fetch student groups', 500);
    }
  },

  async getGuests(req, res) {
    try {
      const { eventId } = req.params;
      const guests = await SeatModel.getGuests(eventId);
      return sendSuccess(res, guests, 'Guests retrieved successfully');
    } catch (error) {
      console.error('Get Guests Error:', error);
      return sendError(res, 'Failed to fetch guests', 500);
    }
  },

  // --- Assignments ---
  async assignPeople(req, res) {
    try {
      const { event_id, seat_group_id, participant_ids, gpa_groups } = req.body;
      
      if (!event_id || !seat_group_id) {
        return sendError(res, 'Target Event and Seat Zone must be specified', 400);
      }

      const group = await SeatModel.getSeatGroupById(seat_group_id);
      if (!group) return sendError(res, 'Selected seat zone no longer exists', 404);

      // Branch 1: Assignment by GPA Groups (Students only)
      if (gpa_groups && Array.isArray(gpa_groups) && gpa_groups.length > 0) {
        if (group.target_type === 'Guest') {
          return sendError(res, 'Academic GPA groups cannot be assigned to Guest zones', 400);
        }
        
        const result = await SeatModel.bulkAssignByGpaGroups(event_id, seat_group_id, gpa_groups);
        return sendSuccess(res, { affected: result.count }, `Successfully assigned ${result.count} graduates to "${group.name}".`);
      }

      // Branch 2: Assignment by individual participant IDs
      if (!participant_ids || !Array.isArray(participant_ids) || participant_ids.length === 0) {
        return sendError(res, 'No participants selected for assignment', 400);
      }

      // Sanitize IDs: Convert to integers and filter out invalid values
      const sanitizedIds = participant_ids
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id));

      if (sanitizedIds.length === 0) {
        return sendError(res, 'Invalid participant identifiers provided', 400);
      }

      // Check for Target Type mismatch if the zone is restricted
      if (group.target_type !== 'Both') {
        const typeCheck = await db.query(`
          SELECT DISTINCT pt.type_name
          FROM event_participants ep
          JOIN people_types pt ON ep.type_id = pt.id
          WHERE ep.eventparticipant_id = ANY($1::int[])
        `, [sanitizedIds]);

        const types = typeCheck.rows.map(r => r.type_name);
        
        if (group.target_type === 'Student' && types.some(t => t !== 'Graduates')) {
          return sendError(res, `Assignment failed: The zone "${group.name}" is restricted to graduates only.`, 400);
        }
        if (group.target_type === 'Guest' && types.some(t => t !== 'Guests')) {
          return sendError(res, `Assignment failed: The zone "${group.name}" is restricted to guests only.`, 400);
        }
      }

      const result = await SeatModel.bulkAssign(event_id, seat_group_id, sanitizedIds);
      return sendSuccess(res, { affected: result.count }, `Successfully assigned ${sanitizedIds.length} participants to "${group.name}".`);
    } catch (error) {
      console.error('Assign People Error:', error);
      // Determine if it's a foreign key violation or other standard DB error
      if (error.code === '23503') {
        return sendError(res, 'Assignment failed: One or more participants are not registered for this event', 400);
      }
      return sendError(res, error.message || 'System failed to process batch assignment', 500);
    }
  },

  async getAssignments(req, res) {
    try {
      const { eventId } = req.params;
      const assignments = await SeatModel.getAssignmentsByEvent(eventId);
      return sendSuccess(res, assignments, 'Assignments retrieved successfully');
    } catch (error) {
      return sendError(res, 'Failed to fetch assignments', 500);
    }
  },

  async updateAssignment(req, res) {
    try {
      const { id } = req.params;
      const { seat_group_id } = req.body;
      const assignment = await SeatModel.updateAssignment(id, seat_group_id);
      return sendSuccess(res, assignment, 'Assignment updated successfully');
    } catch (error) {
      return sendError(res, 'Failed to update assignment', 500);
    }
  },

  async deleteAssignment(req, res) {
    try {
      const { id } = req.params;
      await SeatModel.deleteAssignment(id);
      return sendSuccess(res, null, 'Assignment removed successfully');
    } catch (error) {
      return sendError(res, 'Failed to remove assignment', 500);
    }
  },
  async getGroupsWithAssignments(req, res) {
    try {
      const { eventId } = req.params;
      const groups = await SeatModel.getSeatGroupsWithCounts(eventId);
      return sendSuccess(res, groups, 'Reporting data retrieved successfully');
    } catch (error) {
      console.error('Get Groups With Assignments Error:', error);
      return sendError(res, 'Failed to fetch reporting data', 500);
    }
  },

  async getGroupParticipants(req, res) {
    try {
      const { eventId, groupId } = req.params;
      const participants = await SeatModel.getSeatGroupParticipants(eventId, groupId);
      
      // Enrich with GPA Grade labels for students
      const enriched = participants.map(p => {
        if (p.type_name === 'Graduates' && p.gpa !== null) {
          const gpa = parseFloat(p.gpa);
          // Reuse mapping logic (GPA_MAPPING is not exported, but we know the rules)
          // Actually, I can just hardcode or call a helper if I move it to utils.
          // For now, I'll use the same logic as getGroupedStudents.
          const grade = [
            { label: 'A+', min: 4.00, max: 4.00 },
            { label: 'A',  min: 3.67, max: 3.99 },
            { label: 'A-', min: 3.33, max: 3.66 },
            { label: 'B+', min: 3.00, max: 3.32 },
            { label: 'B',  min: 2.67, max: 2.99 },
            { label: 'B-', min: 2.33, max: 2.66 },
            { label: 'C+', min: 2.00, max: 2.32 },
            { label: 'C',  min: 1.67, max: 1.99 },
            { label: 'F',  min: 0.00, max: 1.66 }
          ].find(m => gpa >= m.min && gpa <= m.max);
          
          return { ...p, grade: grade ? grade.label : 'N/A' };
        }
        return p;
      });

      return sendSuccess(res, enriched, 'Group roster retrieved successfully');
    } catch (error) {
      console.error('Get Group Participants Error:', error);
      return sendError(res, 'Failed to fetch roster', 500);
    }
  },

  async initializeSeats(req, res) {
    try {
      const { event_id, groups } = req.body;
      if (!event_id) return sendError(res, 'Event ID is required', 400);
      if (!groups || !Array.isArray(groups) || groups.length === 0) {
        return sendError(res, 'At least one seat group must be defined.', 400);
      }

      const result = await SeatModel.createManualSeats(event_id, groups);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      console.error('Initialize Seats Error:', error);
      return sendError(res, error.message || 'Failed to initialize seats', 500);
    }
  }
};

module.exports = SeatController;
