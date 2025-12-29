const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  // Token is stored in httpOnly cookie
  const token = req.cookies && req.cookies.token;

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
