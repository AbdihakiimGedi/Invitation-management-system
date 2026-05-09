const express = require('express');
const authRoutes = require('./authRoutes');
const eventRoutes = require('./eventRoutes');
const graduateRoutes = require('./graduateRoutes');
const invitationRoutes = require('./invitationRoutes');
const peopleRoutes = require('./peopleRoutes');
const participantDirectoryRoutes = require('./participantDirectoryRoutes');
const participantListRoutes = require('./participantListRoutes');
const seatRoutes = require('./seatRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const userManagementRoutes = require('./userManagementRoutes');
const reportRoutes = require('./reportRoutes');
const logRoutes = require('./logRoutes');

const router = express.Router();



router.use('/seats', seatRoutes);
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/graduates', graduateRoutes);
router.use('/invitations', invitationRoutes);
router.use('/people', peopleRoutes);
router.use('/participant-directories', participantDirectoryRoutes);
router.use('/participant-lists', participantListRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userManagementRoutes);
router.use('/reports', reportRoutes);
router.use('/logs', logRoutes);

module.exports = router;
