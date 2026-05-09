const express = require('express');
const InvitationController = require('../../controllers/invitationController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

const router = express.Router();



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
router.get('/my-events', authMiddleware, InvitationController.getMyEvents);
router.get('/my-events/:eventId/invitation', authMiddleware, InvitationController.getMyEventInvitation);
router.get('/my-invitations', authMiddleware, InvitationController.getMyInvitations);
router.get('/my-invitations/:invitationId', authMiddleware, InvitationController.getMyInvitation);
router.post('/requests', authMiddleware, InvitationController.createMoreInvitationRequest);

// Admin only: Seating Integration
router.post('/seats', authMiddleware, roleMiddleware(['Admin']), InvitationController.initializeEventSeating);

// Entry Verification (Public or Specific Auth)
router.post('/verify', InvitationController.verifyInvitation);

module.exports = router;
