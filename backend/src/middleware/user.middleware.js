const jwt = require('jsonwebtoken');
const { getJwtSecret, getJwtSecretStatus } = require('../config/jwtSecret');

const userMiddleware = (req, res, next) => {
  try {
    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      console.error('Authentication secret is missing or too short:', getJwtSecretStatus());
      return res.status(500).json({ error: 'Authentication is not configured securely' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);
    
    // Attach decoded user info (id, role) to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = userMiddleware;
