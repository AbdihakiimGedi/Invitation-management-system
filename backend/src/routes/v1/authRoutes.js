const express = require('express');
const AuthController = require('../../controllers/authController');
const rateLimit = require('../../middleware/rateLimitMiddleware');

const router = express.Router();

// Define login route
router.post(
  '/login',
  rateLimit({
    windowMs: 15 * 60_000,
    max: 10,
    keyPrefix: 'login',
    message: 'Too many login attempts. Please wait and try again.'
  }),
  AuthController.login
);

module.exports = router;
