const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwtSecret');

const AuthService = {
  async verifyPassword(plainPassword, passwordHash) {
    try {
      return await bcrypt.compare(plainPassword, passwordHash);
    } catch (error) {
      throw new Error(`Error verifying password: ${error.message}`);
    }
  },

  generateToken(user) {
    try {
      const jwtSecret = getJwtSecret();
      if (!jwtSecret) {
        throw new Error('Authentication is not configured securely');
      }

      const payload = {
        id: user.id,
        role: user.role
      };

      return jwt.sign(payload, jwtSecret, {
        expiresIn: process.env.JWT_EXPIRES_IN
      });
    } catch (error) {
      throw new Error(`Error generating token: ${error.message}`);
    }
  }
};

module.exports = AuthService;
