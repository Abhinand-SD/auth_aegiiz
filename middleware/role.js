function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
    if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

// requires admin or owner-of-resource (ownerId param in req.params)
function requireAdminOrSelf(paramUserIdName = 'id') {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
    if (req.user.role === 'admin') return next();
    const targetUserId = req.params[paramUserIdName] || req.body[paramUserIdName];
    if (!targetUserId) return res.status(400).json({ message: 'target user id not provided' });
    if (String(req.user.id) === String(targetUserId)) return next();
    return res.status(403).json({ message: 'Forbidden: not owner' });
  };
}

module.exports = { requireRole, requireAdminOrSelf };
