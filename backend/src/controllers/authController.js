const AuthService = require('../services/authService');

const AuthController = {
  async login(req, res) {
    try {
      const { username, password } = req.body;

      const cleanUsername = String(username || '').trim();
      const cleanPassword = String(password || '');

      if (!cleanUsername || !cleanPassword) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const { user, token, redirect_path } = await AuthService.login(cleanUsername, cleanPassword);

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
        error.message === 'Invalid username or password' ||
        error.message === 'Account inactive'
      ) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = AuthController;
