const express = require('express');
const router = express.Router();
const SeatController = require('../../controllers/seatController');

// Seat Groups
router.post('/seat-groups', SeatController.createGroup);
router.get('/seat-groups/:eventId', SeatController.getGroups);
router.put('/seat-groups/:id', SeatController.updateGroup);
router.delete('/seat-groups/:id', SeatController.deleteGroup);

// Participant Grouping
router.get('/events/:eventId/student-groups', SeatController.getStudentGroups);
router.get('/events/:eventId/guests', SeatController.getGuests);

// Assignments
router.post('/seat-assignments', SeatController.assignPeople);
router.get('/seat-assignments/:eventId', SeatController.getAssignments);
router.put('/seat-assignments/:id', SeatController.updateAssignment);
router.delete('/seat-assignments/:id', SeatController.deleteAssignment);

// Reporting & Monitoring
router.get('/seat-groups/:eventId/with-assignments', SeatController.getGroupsWithAssignments);
router.get('/seat-groups/:eventId/:groupId/participants', SeatController.getGroupParticipants);

// Initialization
router.post('/initialize', SeatController.initializeSeats);

module.exports = router;
