const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${userRole}`,
        code: 'FORBIDDEN',
      });
    }

    next();
  };
};

const requireAnyRole = (...roles) => requireRole(...roles);

const authorize = (rolesArray) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const userRole = req.user.role;
    if (!rolesArray.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${rolesArray.join(', ')}. Your role: ${userRole}`,
        code: 'FORBIDDEN',
      });
    }
    next();
  };
};

module.exports = { requireRole, requireAnyRole, authorize };
