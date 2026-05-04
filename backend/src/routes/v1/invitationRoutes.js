const express = require('express');
const InvitationController = require('../../controllers/invitationController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

const router = express.Router();



// Admin only: Invitation Generation Batches
router.get('/batches/:eventId', authMiddleware, roleMiddleware(['Admin']), InvitationController.getBatches);
router.post('/batches', authMiddleware, roleMiddleware(['Admin']), InvitationController.createBatch);

// Admin only: Seating Integration
router.post('/seats', authMiddleware, roleMiddleware(['Admin']), InvitationController.initializeEventSeating);

// Entry Verification (Public or Specific Auth)
router.post('/verify', InvitationController.verifyInvitation);

module.exports = router;
