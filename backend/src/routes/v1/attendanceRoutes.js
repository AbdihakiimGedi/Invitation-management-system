const express = require('express');
const AttendanceController = require('../../controllers/attendanceController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

const router = express.Router();
const attendanceRoles = ['Admin', 'Attendance Staff'];

router.get('/events', authMiddleware, roleMiddleware(attendanceRoles), AttendanceController.listEvents);
router.post('/scan/validate', authMiddleware, roleMiddleware(attendanceRoles), AttendanceController.validateScan);
router.post('/scan/confirm', authMiddleware, roleMiddleware(attendanceRoles), AttendanceController.confirmAttendance);
router.get('/events/:eventId/list', authMiddleware, roleMiddleware(attendanceRoles), AttendanceController.listAttendance);
router.get('/events/:eventId/dashboard', authMiddleware, roleMiddleware(attendanceRoles), AttendanceController.dashboard);

module.exports = router;
