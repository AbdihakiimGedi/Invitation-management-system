// Middleware to restrict access based on user roles
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({ error: 'Access denied: User role not found' });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Role validation error:', error);
      return res.status(500).json({ error: 'Internal server error during role validation' });
    }
  };
};

module.exports = roleMiddleware;
