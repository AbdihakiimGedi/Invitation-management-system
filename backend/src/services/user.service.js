const UserModel = require('../models/user.model');

const UserService = {
  async getUserByUsername(username) {
    try {
      const user = await UserModel.findByUsername(username);
      return user;
    } catch (error) {
      throw new Error(`Error fetching user by username: ${error.message}`);
    }
  }
};

module.exports = UserService;
