const jwt = require('jsonwebtoken');
const { getJwtSecret, getJwtSecretStatus } = require('../config/jwtSecret');

const authMiddleware = (req, res, next) => {
  try {
    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      console.error('Authentication secret is missing or too short:', getJwtSecretStatus());
      return res.status(500).json({ error: 'Authentication is not configured securely' });
    }

    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication token is required' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
    });

    if (!decoded || !decoded.id || !decoded.role) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    // Attach decoded user info (id, role) to request object
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
