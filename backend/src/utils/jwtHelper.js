const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

const generateToken = (userId, email, role) => {
  return jwt.sign(
    { 
      userId, 
      email, 
      role 
    },
    jwtSecret,
    { 
      expiresIn: jwtExpiresIn 
    }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  generateToken,
  verifyToken
};