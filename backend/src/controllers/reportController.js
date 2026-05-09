const ReportService = require('../services/reportService');

const ReportController = {
  async listEvents(req, res) {
    try {
      const events = await ReportService.getEventsList();
      res.json({ status: 'success', data: events });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  },

  async getEventReport(req, res) {
    try {
      const { eventId } = req.params;
      const report = await ReportService.getEventReport(eventId);
      res.json({ status: 'success', data: report });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
};

module.exports = ReportController;
