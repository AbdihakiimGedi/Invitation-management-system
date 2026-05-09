const express = require('express');
const DashboardController = require('../../controllers/dashboardController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

const router = express.Router();

router.get('/overview', authMiddleware, roleMiddleware(['Admin']), DashboardController.overview);

module.exports = router;
