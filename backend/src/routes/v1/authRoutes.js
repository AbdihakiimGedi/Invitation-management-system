const express = require('express');
const AuthController = require('../../controllers/authController');

const router = express.Router();

// Define login route
router.post('/login', AuthController.login);

module.exports = router;
