const ActivityLogService = require('../services/activityLogService');

const ActivityLogController = {
  async getLogs(req, res) {
    try {
      const filters = {
        search: req.query.search,
        actionType: req.query.actionType,
        actorUserId: req.query.actorUserId,
        limit: req.query.limit,
        offset: req.query.offset
      };
      const data = await ActivityLogService.getLogs(filters);
      res.json({ status: 'success', data });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
};

module.exports = ActivityLogController;
