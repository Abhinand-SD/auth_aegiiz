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

    // 1. Validate session exists
    const session = await Session.findById(payload.sessionId);
    if (!session)
      return res.status(401).json({ message: 'Session invalidated' });

    // 2. Validate session belongs to user
    if (session.userId.toString() !== payload.userId)
      return res.status(401).json({ message: 'Session-user mismatch' });

    // 3. Validate token stored in session (prevents token swapping)
    if (session.token !== token)
      return res.status(401).json({ message: 'Token does not match active session' });

    // 4. Validate session expiration
    if (session.expiresAt && session.expiresAt < new Date())
      return res.status(401).json({ message: 'Session expired' });

    // 5. Load user details (always trust DB role)
    const user = await User.findById(payload.userId).select('-password');
    if (!user)
      return res.status(401).json({ message: 'User not found' });
    // always trust DB role
    req.user = {
      id: user._id,
      role: user.role,  
      details: user
    };

    req.session = session;
    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid or expired token',
      error: err.message
    });
  }
}

module.exports = { authenticate };
