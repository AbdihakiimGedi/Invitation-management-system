const express = require('express');
const InvitationController = require('../../controllers/invitationController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const rateLimit = require('../../middleware/rateLimitMiddleware');

const router = express.Router();
const participantRoles = ['Graduate', 'Guest', 'Special Guest'];



// Admin only: Invitation Generation Batches
router.get('/batches/:eventId', authMiddleware, roleMiddleware(['Admin']), InvitationController.getBatches);
router.post('/batches', authMiddleware, roleMiddleware(['Admin']), InvitationController.createBatch);
router.get('/management/events', authMiddleware, roleMiddleware(['Admin']), InvitationController.getManagementEvents);
router.get('/management/events/:eventId/sent-participants', authMiddleware, roleMiddleware(['Admin']), InvitationController.getSentParticipants);
router.post('/management/events/:eventId/participants/:eventParticipantId/resend', authMiddleware, roleMiddleware(['Admin']), InvitationController.resendParticipantInvitation);
router.get('/management/events/:eventId/requests', authMiddleware, roleMiddleware(['Admin']), InvitationController.getMoreInvitationRequests);
router.get('/management/requests/:requestId', authMiddleware, roleMiddleware(['Admin']), InvitationController.getMoreInvitationRequestDetails);
router.post('/management/requests/:requestId/approve', authMiddleware, roleMiddleware(['Admin']), InvitationController.approveMoreInvitationRequest);

// Authenticated participant portal
router.get('/my-events', authMiddleware, roleMiddleware(participantRoles), InvitationController.getMyEvents);
router.get('/my-events/:eventId/invitation', authMiddleware, roleMiddleware(participantRoles), InvitationController.getMyEventInvitation);
router.get('/my-invitations', authMiddleware, roleMiddleware(participantRoles), InvitationController.getMyInvitations);
router.get('/my-invitations/:invitationId', authMiddleware, roleMiddleware(participantRoles), InvitationController.getMyInvitation);
router.post(
  '/requests',
  authMiddleware,
  roleMiddleware(['Graduate']),
  rateLimit({ windowMs: 60 * 60_000, max: 12, keyPrefix: 'invitation-request' }),
  InvitationController.createMoreInvitationRequest
);

// Admin only: Seating Integration
router.post('/seats', authMiddleware, roleMiddleware(['Admin']), InvitationController.initializeEventSeating);

// Entry Verification (Public or Specific Auth)
router.post(
  '/verify',
  rateLimit({ windowMs: 60_000, max: 60, keyPrefix: 'invitation-verify' }),
  InvitationController.verifyInvitation
);

module.exports = router;
