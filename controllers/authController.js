const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register a new admin (run once, then remove/protect this route)
// @route   POST /api/auth/register
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const admin = await Admin.create({ name, email, password });

    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      token: generateToken(admin._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Login admin
// @route   POST /api/auth/login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      token: generateToken(admin._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerAdmin, loginAdmin };
