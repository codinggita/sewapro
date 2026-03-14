const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Worker = require('../models/Worker');
const Client = require('../models/Client');

// POST /api/auth/client/signup
router.post('/client/signup', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  body('password')
    .isLength({ min: 8 }).withMessage('Min 8 characters')
    .matches(/[A-Z]/).withMessage('Must have 1 uppercase')
    .matches(/[0-9]/).withMessage('Must have 1 number')
    .matches(/[!@#$%^&*]/).withMessage('Must have 1 special char'),
  body('city').notEmpty().withMessage('City is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, phone, password, city, address } = req.body;

  try {
    const existing = await Client.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const client = await Client.create({
      name, email, phone, password, city, address: address || ''
    });

    const token = jwt.sign(
      { id: client._id, role: client.role, name: client.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: client._id, name: client.name, email: client.email, role: client.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/worker/signup
router.post('/worker/signup', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  body('password')
    .isLength({ min: 8 }).withMessage('Min 8 characters')
    .matches(/[A-Z]/).withMessage('Must have 1 uppercase')
    .matches(/[0-9]/).withMessage('Must have 1 number')
    .matches(/[!@#$%^&*]/).withMessage('Must have 1 special char'),
  body('category').notEmpty().withMessage('Category is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, phone, password, category, experience, pricePerHour, skills, bio, city, address } = req.body;

  try {
    const existing = await Worker.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const worker = await Worker.create({
      name, email, phone, password, category,
      experience: experience || 0,
      pricePerHour: pricePerHour || 100,
      skills: skills || [],
      bio: bio || '',
      city: city || '',
      address: address || '',
      isVerified: true
    });

    const token = jwt.sign(
      { id: worker._id, role: worker.role, name: worker.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: worker._id, name: worker.name, email: worker.email, role: worker.role, category: worker.category }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/client/login
router.post('/client/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await Client.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/worker/login
router.post('/worker/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const worker = await Worker.findOne({ email });
    if (!worker) return res.status(404).json({ message: 'User not found' }); // Or 'Worker not found'

    const isMatch = await bcrypt.compare(password, worker.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (worker.isSuspended) return res.status(403).json({ message: `Account suspended: ${worker.suspendReason}` });

    const token = jwt.sign(
      { id: worker._id, role: worker.role, name: worker.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: worker._id, name: worker.name, email: worker.email, role: worker.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

// POST /api/auth/admin/login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Simple admin check — in production use env vars
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sewapro.com';
    const ADMIN_PASS  = process.env.ADMIN_PASS  || 'Admin@123';
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASS) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    const token = require('jsonwebtoken').sign(
      { id: 'admin', role: 'admin', name: 'Admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: 'admin', name: 'SewaPro Admin', email: ADMIN_EMAIL, role: 'admin' } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
