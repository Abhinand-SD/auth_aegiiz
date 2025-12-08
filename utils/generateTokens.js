const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const generateAccessToken = ({ userId, role, sessionId }) => {
  return jwt.sign(
    { userId, role, sessionId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXP || '15m' }
  );
};

// For refresh token we use a random uuid string (opaque) and store it in DB
const generateRefreshToken = () => {
  return uuidv4() + '.' + uuidv4(); // longer random string
};

module.exports = { generateAccessToken, generateRefreshToken };
