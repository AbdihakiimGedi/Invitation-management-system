const express = require('express');
const ReportController = require('../../controllers/reportController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(['Admin']));

router.get('/events', ReportController.listEvents);
router.get('/events/:eventId', ReportController.getEventReport);

module.exports = router;
