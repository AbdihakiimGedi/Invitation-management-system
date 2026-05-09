const AuthService = require('../services/authService');

const AuthController = {
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const { user, token, redirect_path } = await AuthService.login(username, password);

      // Return role to the frontend for navigation handling
      // Optionally, token could be set in an HTTP-only cookie here
      return res.status(200).json({
        message: 'Login successful',
        user,
        token,
        role: user.role,
        redirect_path
      });

    } catch (error) {
      if (
        error.message === 'User not found' || 
        error.message === 'Invalid username or password' ||
        error.message === 'Account inactive'
      ) {
        return res.status(401).json({ error: error.message });
      }
      
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = AuthController;
