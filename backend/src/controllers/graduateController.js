const GraduateService = require('../services/graduateService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

const GraduateController = {
  async register(req, res) {
    try {
      const graduate = await GraduateService.registerGraduate(req.body);
      return sendSuccess(res, graduate, 'Graduate registered successfully', 201);
    } catch (error) {
      const statusCode = error.code === '23505' ? 409 : 500; // Conflict for duplicate unique key
      return sendError(res, error.message, statusCode);
    }
  },

  async list(req, res) {
    try {
      const graduates = await GraduateService.listGraduates();
      return sendSuccess(res, graduates, 'Graduates retrieved successfully');
    } catch (error) {
      return sendError(res, error.message);
    }
  }
};

module.exports = GraduateController;
