const User = require('../models/User');
const Session = require('../models/Session');

exports.getAllUsers = async (req, res) => {
  // admin route or pagination
  const users = await User.find().select('-password');
  res.json(users);
};

exports.getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json(user);
};

exports.updateUser = async (req, res) => {
  const updates = req.body;
  // if password update, it will be hashed by pre('save') so use findById then set and save
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Not found' });

  Object.keys(updates).forEach(k => {
    if (k !== 'role' || req.user.role === 'admin') user[k] = updates[k];
  });

  await user.save();
  res.json({ message: 'Updated', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

exports.deleteUser = async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'Not found' });

  // delete user sessions
  await Session.deleteMany({ user: userId });
  await User.findByIdAndDelete(userId);

  res.json({ message: 'Deleted user' });
};
