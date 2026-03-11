const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  // Try to get token from cookie first (for browser sessions)
  let token = req.cookies && req.cookies.token;
  
  // If no cookie, try Authorization header (for API calls)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach decoded payload to request
    // Expected payload: { userId, email, role }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

module.exports = authenticate;