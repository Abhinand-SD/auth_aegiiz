const User = require('../models/User');
const Session = require('../models/Session');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const jwt = require('jsonwebtoken');

// helper: remove oldest sessions if exceed limit
async function enforceSessionLimit(userId) {
  const limit = parseInt(process.env.SESSION_LIMIT || 2, 10);
  const sessions = await Session.find({ user: userId }).sort({ createdAt: 1 }); // oldest first
  if (sessions.length >= limit) {
    // remove oldest until sessions.length < limit
    const removeCount = sessions.length - (limit - 1); // remove as needed to make room for new one
    const toRemove = sessions.slice(0, removeCount);
    const ids = toRemove.map(s => s._id);
    await Session.deleteMany({ _id: { $in: ids } });
  }
}

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const user = new User({ name, email, password, role });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password, deviceInfo } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // enforce session limit
    await enforceSessionLimit(user._id);

    // create new session
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = new Session({
      user: user._id,
      refreshToken,
      deviceInfo: deviceInfo || 'unknown',
      expiresAt,
    });
    await session.save();

    const accessToken = generateAccessToken({
      userId: user._id,
      role: user.role,
      sessionId: session._id,
    });

    res.json({
      accessToken,
      refreshToken,
      expiresIn: process.env.ACCESS_TOKEN_EXP || '15m',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

  try {
    const session = await Session.findOne({ refreshToken }).populate('user');
    if (!session) return res.status(401).json({ message: 'Invalid refresh token' });

    if (session.expiresAt && session.expiresAt < new Date()) {
      await Session.findByIdAndDelete(session._id);
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    // update lastUsedAt
    session.lastUsedAt = new Date();
    await session.save();

    const accessToken = generateAccessToken({
      userId: session.user._id,
      role: session.user.role,
      sessionId: session._id,
    });

    res.json({ accessToken, expiresIn: process.env.ACCESS_TOKEN_EXP || '15m' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = async (req, res) => {
  // requires authentication (or accept refresh token)
  const { refreshToken } = req.body;
  try {
    if (!refreshToken) {
      // if using sessionId via access token, you can delete req.session
      if (req.session) {
        await Session.findByIdAndDelete(req.session._id);
        return res.json({ message: 'Logged out' });
      }
      return res.status(400).json({ message: 'refreshToken or authenticated session required' });
    }
    await Session.findOneAndDelete({ refreshToken });
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
