const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'No token provided' });

  // Token payload must contain { user_id, role } matching DB columns
  jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    req.user = decoded; 
    next();
  });
};

// Roles must match schema: 'STUDENT', 'PLACEMENT_STAFF', 'ADMIN'
const authorizeRole = (allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      message: `Access Denied. Required: ${allowedRoles.join(', ')}` 
    });
  }
  next();
};

module.exports = { verifyToken, authorizeRole };