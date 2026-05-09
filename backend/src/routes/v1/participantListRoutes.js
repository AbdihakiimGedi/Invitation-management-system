const express = require('express');
const ParticipantListController = require('../../controllers/participantListController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

const router = express.Router();

router.get('/events', authMiddleware, roleMiddleware(['Admin']), ParticipantListController.listEvents);
router.get('/events/:eventId', authMiddleware, roleMiddleware(['Admin']), ParticipantListController.getEventLists);
router.get(
  '/events/:eventId/participants/:eventParticipantId',
  authMiddleware,
  roleMiddleware(['Admin']),
  ParticipantListController.getParticipantDetails
);

module.exports = router;
