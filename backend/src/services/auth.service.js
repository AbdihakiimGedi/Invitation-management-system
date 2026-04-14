const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
      const payload = {
        id: user.id,
        role: user.role
      };

      return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
      });
    } catch (error) {
      throw new Error(`Error generating token: ${error.message}`);
    }
  }
};

module.exports = AuthService;
