const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '3d' });
};

// Register a doctor (only for admin)
const registerDoctor = async (req, res) => {
  const { username, password } = req.body;

  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: 'Doctor already exists' });

    const user = await User.create({ username, password, role: 'doctor' });
    res.status(201).json({ message: 'Doctor created', id: user._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Login a doctor or admin
const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });

    res.json({ id: user._id, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout user
const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

module.exports = {
  login,
  logout,
  registerDoctor,
};
