const jwt = require('jsonwebtoken');
const Worker = require('../models/Worker');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    // Check if worker is suspended
    if (decoded.role === 'worker') {
      const worker = await Worker.findById(decoded.id).select('isSuspended suspendReason');
      if (worker?.isSuspended) {
        return res.status(403).json({ message: `Account suspended: ${worker.suspendReason || 'Contact admin.'}` });
      }
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
