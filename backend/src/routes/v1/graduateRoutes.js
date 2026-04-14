const express = require('express');
const GraduateController = require('../../controllers/graduateController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

const router = express.Router();

// Only Admin can register graduates
router.post('/register', authMiddleware, roleMiddleware(['Admin']), GraduateController.register);

// Authenticated users (Admins, staff) can list graduates
router.get('/', authMiddleware, roleMiddleware(['Admin']), GraduateController.list);

module.exports = router;
