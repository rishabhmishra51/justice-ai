const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { User } = require('../models');
const auth = require('../middleware/auth');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields required' });

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hash, role: role || 'investigator' });
    const { password: _, ...userData } = user.toJSON();
    res.status(201).json({ success: true, token: sign(user.id), user: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const { password: _, ...userData } = user.toJSON();
    res.json({ success: true, token: sign(user.id), user: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get me
router.get('/me', auth, (req, res) => res.json({ success: true, user: req.user }));

module.exports = router;
