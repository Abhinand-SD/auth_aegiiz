const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  refreshToken: { type: String, required: true }, // store hashed if you like
  deviceInfo: { type: String }, // optional: browser/device identifier
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }, // optional: set based on refresh expiry
});

module.exports = mongoose.model('Session', SessionSchema);
