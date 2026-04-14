const express = require('express');
const EventController = require('../../controllers/eventController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

const router = express.Router();

// Publicly accessible for authenticated users to view graduation info
router.get('/', authMiddleware, EventController.list);
router.get('/:id', authMiddleware, EventController.get);
router.get('/:id/participants', authMiddleware, roleMiddleware(['Admin']), EventController.getParticipants);

// Admin only routes for managing events
router.post('/', authMiddleware, roleMiddleware(['Admin']), EventController.create);
router.put('/:id', authMiddleware, roleMiddleware(['Admin']), EventController.update);
router.delete('/:id', authMiddleware, roleMiddleware(['Admin']), EventController.delete);

module.exports = router;
