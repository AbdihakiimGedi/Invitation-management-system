const express = require('express');
const ActivityLogController = require('../../controllers/activityLogController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(['Admin']));

router.get('/', ActivityLogController.getLogs);

module.exports = router;
