const DashboardService = require('../services/dashboardService');

const DashboardController = {
  async overview(req, res) {
    try {
      const data = await DashboardService.getOverview();
      res.json({ status: 'success', data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = DashboardController;
