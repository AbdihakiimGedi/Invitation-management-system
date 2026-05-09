const express = require('express');
const ParticipantDirectoryController = require('../../controllers/participantDirectoryController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

const router = express.Router();

router.get('/types/:typeSlug/events', authMiddleware, roleMiddleware(['Admin']), ParticipantDirectoryController.listEvents);
router.get('/types/:typeSlug/events/:eventId/participants', authMiddleware, roleMiddleware(['Admin']), ParticipantDirectoryController.listParticipants);
router.get(
  '/types/:typeSlug/events/:eventId/participants/:eventParticipantId',
  authMiddleware,
  roleMiddleware(['Admin']),
  ParticipantDirectoryController.getParticipantDetails
);
router.patch(
  '/types/:typeSlug/events/:eventId/participants/:eventParticipantId',
  authMiddleware,
  roleMiddleware(['Admin']),
  ParticipantDirectoryController.updateParticipant
);
router.get(
  '/types/:typeSlug/events/:eventId/participants/:eventParticipantId/credential',
  authMiddleware,
  roleMiddleware(['Admin']),
  ParticipantDirectoryController.getCredential
);
router.post(
  '/types/:typeSlug/events/:eventId/participants/:eventParticipantId/password',
  authMiddleware,
  roleMiddleware(['Admin']),
  ParticipantDirectoryController.generatePassword
);

module.exports = router;
