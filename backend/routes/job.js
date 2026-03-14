const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Worker = require('../models/Worker');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// POST /api/jobs
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, postedBy: req.user.id });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/jobs
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 8, status, category, search, sortBy } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (search) filter.title = new RegExp(search, 'i');

    let sortObj = { createdAt: -1 };
    if (sortBy === 'oldest') sortObj = { createdAt: 1 };
    if (sortBy === 'budgetHigh') sortObj = { 'budget.max': -1 };
    if (sortBy === 'budgetLow') sortObj = { 'budget.min': 1 };

    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .populate('assignedWorker', 'name profilePhoto category')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ jobs, currentPage: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('assignedWorker', '-password');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/jobs/:id/assign
router.patch('/:id/assign', adminMiddleware, async (req, res) => {
  try {
    const { workerId } = req.body;
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { assignedWorker: workerId, status: 'Assigned', assignedAt: new Date() },
      { new: true }
    ).populate('assignedWorker', '-password');
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/jobs/:id/status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status };
    if (status === 'In-Progress') update.startedAt = new Date();
    if (status === 'Completed') {
      update.completedAt = new Date();
      const job = await Job.findById(req.params.id);
      if (job.assignedWorker) {
        await Worker.findByIdAndUpdate(job.assignedWorker, { $inc: { totalJobsDone: 1 } });
      }
    }
    const job = await Job.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/jobs/:id/rate
router.patch('/:id/rate', adminMiddleware, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    job.rating = rating;
    job.review = review;
    job.ratedAt = new Date();
    await job.save();

    if (job.assignedWorker) {
      const worker = await Worker.findById(job.assignedWorker);
      const newRating = ((worker.rating * worker.totalReviews) + rating) / (worker.totalReviews + 1);
      worker.rating = Math.round(newRating * 10) / 10;
      worker.totalReviews += 1;
      await worker.save();
    }

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/jobs/:id
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
