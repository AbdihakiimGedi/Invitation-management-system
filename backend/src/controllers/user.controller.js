const UserService = require('../services/user.service');
const AuthService = require('../services/auth.service');

const UserController = {
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // 1. Find user by username
      const user = await UserService.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // 2. Check if user is active
      if (!user.is_active) {
        return res.status(401).json({ error: 'User inactive' });
      }

      // 3. Verify password
      const isPasswordValid = await AuthService.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      // 4. Generate token
      const token = AuthService.generateToken(user);

      // 5. Return safe user data and token
      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        token
      });

    } catch (error) {
      console.error('Login error:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = UserController;
