const AttendanceService = require('../services/attendanceService');

const AttendanceController = {
  async listEvents(req, res) {
    try {
      const events = await AttendanceService.listActiveEvents();
      res.json({ status: 'success', data: events });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async validateScan(req, res) {
    try {
      const data = await AttendanceService.validateScan(req.body.event_id, req.body.qr_token);
      res.json({ status: 'success', data });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },

  async confirmAttendance(req, res) {
    try {
      const data = await AttendanceService.confirmAttendance(
        req.body.event_id,
        req.body.qr_token,
        req.user.id
      );
      res.json({ status: 'success', data, message: 'Eligible Attended Successfully' });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },

  async listAttendance(req, res) {
    try {
      const data = await AttendanceService.listAttendance(req.params.eventId);
      res.json({ status: 'success', data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async dashboard(req, res) {
    try {
      const data = await AttendanceService.getDashboard(req.params.eventId);
      res.json({ status: 'success', data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = AttendanceController;
