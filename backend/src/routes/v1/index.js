const express = require('express');
const authRoutes = require('./authRoutes');
const eventRoutes = require('./eventRoutes');
const graduateRoutes = require('./graduateRoutes');
const invitationRoutes = require('./invitationRoutes');
const peopleRoutes = require('./peopleRoutes');
const seatRoutes = require('./seatRoutes');

const router = express.Router();



router.use('/seats', seatRoutes);
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/graduates', graduateRoutes);
router.use('/invitations', invitationRoutes);
router.use('/people', peopleRoutes);

module.exports = router;
