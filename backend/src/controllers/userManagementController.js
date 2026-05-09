const UserManagementService = require('../services/userManagementService');

const UserManagementController = {
  async listUsers(req, res) {
    try {
      const users = await UserManagementService.listUsers(req.query);
      res.json({ status: 'success', data: users });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async listRoles(req, res) {
    try {
      const roles = await UserManagementService.getRoles();
      res.json({ status: 'success', data: roles });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createUser(req, res) {
    try {
      const data = await UserManagementService.createUser(req.user.id, req.body);
      res.status(201).json({ status: 'success', data, message: 'User created successfully' });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },

  async updateUser(req, res) {
    try {
      const user = await UserManagementService.updateUser(req.user.id, req.params.userId, req.body);
      res.json({ status: 'success', data: user, message: 'User updated successfully' });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },

  async resetPassword(req, res) {
    try {
      const data = await UserManagementService.resetPassword(req.user.id, req.params.userId);
      res.json({ status: 'success', data, message: 'Password reset successfully' });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
};

module.exports = UserManagementController;
