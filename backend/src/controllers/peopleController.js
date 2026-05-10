const PeopleService = require('../services/peopleService');
const EventModel = require('../models/eventModel');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const path = require('path');

const PeopleController = {
  /**
   * GET /api/v1/people/types
   */
  async listTypes(req, res) {
    try {
      const types = await PeopleService.getPeopleTypes();
      return sendSuccess(res, types, 'People types retrieved successfully');
    } catch (error) {
      return sendError(res, 'Failed to fetch people types', 500);
    }
  },

  /**
   * GET /api/v1/people/lookup/:tableName
   */
  async getLookupData(req, res) {
    try {
      const { tableName } = req.params;
      const filters = req.query; // Captures ?faculty_id=...
      const data = await PeopleService.getLookupData(tableName, filters);
      return sendSuccess(res, data, `Lookup data for ${tableName} retrieved successfully`);
    } catch (error) {
      return sendError(res, error.message || `Failed to fetch lookup data for ${tableName}`, 500);
    }
  },

  /**
   * GET /api/v1/people/departments/by-faculty/:facultyId
   */
  async getDepartmentsByFaculty(req, res) {
    try {
      const { facultyId } = req.params;
      console.log(`[DEBUG] Controller getDepartmentsByFaculty for facultyId: ${facultyId}`);
      if (!facultyId) {
        return sendError(res, 'Faculty ID is required', 400);
      }
      const data = await PeopleService.getLookupData('departments', { faculty_id: facultyId });
      return sendSuccess(res, data, `Departments for faculty ${facultyId} retrieved successfully`);
    } catch (error) {
      return sendError(res, error.message || 'Failed to fetch departments by faculty', 500);
    }
  },

  /**
   * GET /api/v1/people/columns/:tableName
   */
  async listColumns(req, res) {
    try {
      const { tableName } = req.params;
      const columns = await PeopleService.getTableColumns(tableName);
      return sendSuccess(res, columns, `Columns for ${tableName} retrieved successfully`);
    } catch (error) {
      return sendError(res, `Failed to fetch columns for table ${tableName}`, 500);
    }
  },

  /**
   * GET /api/v1/people/schema/:tableName
   * Returns rich schema with type info (direct vs lookup) for the mapping UI.
   */
  async getMappingSchema(req, res) {
    try {
      const { tableName } = req.params;
      const schema = await PeopleService.getMappingSchema(tableName);
      if (!schema.length) {
        return sendError(res, `No schema found for table: ${tableName}`, 404);
      }
      return sendSuccess(res, schema, `Schema for ${tableName} retrieved successfully`);
    } catch (error) {
      return sendError(res, `Failed to fetch schema for table ${tableName}`, 500);
    }
  },

  /**
   * GET /api/v1/people/preview
   */
  async searchPreview(req, res) {
    try {
      const { search, type } = req.query;
      if (!search) {
        return sendError(res, 'Search term is required', 400);
      }
      
      const results = await PeopleService.searchPeoplePreview(search, type);
      return sendSuccess(res, results, 'Search completed successfully');
    } catch (error) {
      return sendError(res, 'Failed to perform search', 500);
    }
  },

  /**
   * POST /api/v1/people/upload-preview
   */
  async uploadPreview(req, res) {
    try {
      if (!req.file) {
        return sendError(res, 'No file uploaded', 400);
      }
      const headers = await PeopleService.getFileHeaders(req.file.path);
      return sendSuccess(res, { headers, filePath: req.file.path }, 'File parsed successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to parse file headers', error.message?.includes('Only CSV') ? 400 : 500);
    }
  },

  /**
   * POST /api/v1/people/import
   */
  async processImport(req, res) {
    try {
      const { tableName, eventId, mapping, filePath, typeName, typeId, confirmCapacity } = req.body;
      if (!tableName || !eventId || !mapping || !filePath) {
        return sendError(res, 'Missing required import parameters', 400);
      }

      // STRICT NORMALIZATION: Ensure confirmCapacity is a boolean (default: false)
      const isConfirmed = confirmCapacity === true || confirmCapacity === 'true';

      const result = await PeopleService.importByType({
        eventId,
        typeId,
        typeName,
        tableName,
        mapping,
        dataOrPath: filePath,
        confirmCapacity: isConfirmed,
        isPath: true
      });
      
      // Handle Capacity Interruption (Special Status)
      if (result.status === 'capacity_exceeded') {
        return sendSuccess(res, result, 'Threshold exceeded. Awaiting confirmation.');
      }

      const count = result.addedToEvent || result.count || 0;
      return sendSuccess(res, result, `Processed ${count} records successfully`);
    } catch (error) {
      console.error('Import Controller Error:', error);
      return sendError(res, error.message || 'Import failed due to server error', 500);
    }
  },

  /**
   * POST /api/v1/people/manual-register
   */
  async manualRegister(req, res) {
    try {
      const { eventId, typeName, typeId, data, confirmCapacity } = req.body;
      if (!eventId || (!typeId && !typeName) || !data || !Array.isArray(data)) {
        return sendError(res, 'Missing required parameters for manual registration', 400);
      }

      const isConfirmed = confirmCapacity === true || confirmCapacity === 'true';
      const result = await PeopleService.manualRegister(eventId, typeName, data, isConfirmed, typeId);

      if (result.status === 'capacity_exceeded') {
        return sendSuccess(res, result, 'Threshold exceeded. Awaiting confirmation.');
      }

      const count = result.addedToEvent || result.insertedStudents || result.insertedGuests || 0;
      return sendSuccess(res, result, `Successfully registered ${count} participants manually`);
    } catch (error) {
      console.error('Manual Register Controller Error:', error);
      return sendError(res, error.message || 'Manual registration failed', 500);
    }
  },

  /**
   * POST /api/v1/people/process-participation
   */
  async finalizeParticipation(req, res) {
    try {
      const { eventId, studentData, exclusions, typeName, typeId } = req.body;
      
      if (!eventId || !studentData) {
        return sendError(res, 'Event ID and Student Data are required', 400);
      }

      const result = await PeopleService.processParticipation(eventId, studentData, exclusions || [], typeName, typeId);
      return sendSuccess(res, result, 'Event participation finalized successfully');
    } catch (error) {
      return sendError(res, error.message || 'Participation processing failed', 500);
    }
  },

  /**
   * PATCH /api/v1/people/participation
   * Toggles the is_participating flag for a specific user/event pair.
   */
  async updateParticipationStatus(req, res) {
    try {
      const { eventId, userId, isParticipating, typeId } = req.body;
      
      if (!eventId || !userId) {
        return sendError(res, 'Event ID and User ID are required for participation updates.', 400);
      }

      const result = await PeopleService.updateParticipationStatus(
        eventId, 
        userId, 
        isParticipating === true || isParticipating === 'true', 
        typeId
      );

      const message = result.action === 'updated' 
        ? 'Participation record updated successfully.' 
        : 'New participation record initialized.';

      return sendSuccess(res, result, message);
    } catch (error) {
      console.error('Participation Update Controller Error:', error);
      return sendError(res, error.message || 'Failed to update participation state.', 500);
    }
  },

  /**
   * GET /api/v1/people/transfer/available/:excludeEventId
   */
  async listAvailableTransferEvents(req, res) {
    try {
      const { excludeEventId } = req.params;
      const events = await EventModel.getAvailableForTransfer(excludeEventId);
      return sendSuccess(res, events, 'Available transfer events retrieved successfully');
    } catch (error) {
      console.error('List Transfer Targets Error:', error);
      return sendError(res, 'Failed to fetch valid transfer targets', 500);
    }
  },

  /**
   * PATCH /api/v1/people/transfer
   */
  async transferParticipant(req, res) {
    try {
      const { userId, sourceEventId, targetEventId } = req.body;
      
      if (!userId || !sourceEventId || !targetEventId) {
        return sendError(res, 'Missing essential transfer parameters (User, Source, Target).', 400);
      }

      const result = await PeopleService.transferParticipant({
        userId,
        sourceEventId,
        targetEventId
      });

      return sendSuccess(res, result, `Participant successfully migrated to ${result.targetEventName}.`);
    } catch (error) {
      console.error('Transfer Controller Error:', error);
      return sendError(res, error.message || 'Workflow interruption during transfer.', 500);
    }
  }
};

module.exports = PeopleController;
