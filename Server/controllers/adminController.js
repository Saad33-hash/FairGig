const User = require('../models/User');

const serializeUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  avatar: user.avatar,
  role: user.role,
  status: user.status,
  city: user.city,
  category: user.category,
  createdAt: user.createdAt,
});

const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ status: 'pending' }).sort({ createdAt: 1 });
    return res.json({ users: users.map(serializeUser) });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = 'approved';
    await user.save();
    return res.json({ message: 'User approved', user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

const rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = 'rejected';
    await user.save();
    return res.json({ message: 'User rejected', user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = { getPendingUsers, approveUser, rejectUser };
