const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const ActivityLogService = require('./activityLogService');

const getRedirectPath = (role) => {
  const paths = {
    Admin: '/admin',
    Graduate: '/graduate',
    Guest: '/guest',
    'Special Guest': '/vip',
    'Attendance Staff': '/attendance'
  };
  return paths[role] || '/';
};

const AuthService = {
  async login(username, password) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('Authentication is not configured securely');
    }

    // 1. Find user by username
    const cleanUsername = String(username || '').trim();
    const user = await UserModel.findByUsername(cleanUsername);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // 2. Check if user is active
    if (!user.is_active) {
      throw new Error('Account inactive');
    }

    // 3. Verify password using hash comparison
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    // 4. Generate JWT token
    const tokenPayload = {
      id: user.id,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      algorithm: 'HS256',
    });

    // 5. Return user info (safe data only) and token
    const safeUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      created_at: user.created_at,
    };

    await ActivityLogService.log({
      actorUserId: user.id,
      actionType: 'USER_LOGIN',
      entityType: 'users',
      entityId: user.id,
      description: `User login: ${user.username}`
    });

    return { user: safeUser, token, redirect_path: getRedirectPath(user.role) };
  }
};

module.exports = AuthService;
