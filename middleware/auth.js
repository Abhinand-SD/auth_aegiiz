const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const User = require('../models/User');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // payload contains userId, role, sessionId
    const session = await Session.findById(payload.sessionId);
    if (!session) return res.status(401).json({ message: 'Session invalidated' });

    // Optionally check expiration:
    if (session.expiresAt && session.expiresAt < new Date())
      return res.status(401).json({ message: 'Session expired' });

    // attach user info to request
    const user = await User.findById(payload.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = { id: user._id, role: payload.role || user.role, details: user };
    req.session = session;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token', error: err.message });
  }
}

module.exports = { authenticate };
