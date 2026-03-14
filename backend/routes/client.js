const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Job = require('../models/Job');
const Worker = require('../models/Worker');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findById(req.user.id).select('-password');
    res.json(client);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.user.id, req.body, { new: true }).select('-password');
    res.json(client);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/jobs', authMiddleware, async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, clientId: req.user.id, status: 'Pending' });
    res.status(201).json(job);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/jobs', authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ clientId: req.user.id })
      .populate('acceptedBy', 'name phone profilePhoto category rating pricePerHour liveLocation')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/jobs/:id', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, clientId: req.user.id })
      .populate('acceptedBy', 'name phone profilePhoto category rating pricePerHour liveLocation')
      .populate('clientId', 'name phone profilePhoto city');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/jobs/:id', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, clientId: req.user.id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status !== 'Pending') return res.status(400).json({ message: 'Cannot cancel job once accepted' });
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job cancelled' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/jobs/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { rating, review, reviewPhotos } = req.body;
    const job = await Job.findOne({ _id: req.params.id, clientId: req.user.id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status !== 'Completed') return res.status(400).json({ message: 'Can only rate completed jobs' });
    if (job.isRated) return res.status(400).json({ message: 'Already rated' });
    const worker = await Worker.findById(job.acceptedBy);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    const total = (worker.totalReviews || 0) + 1;
    worker.rating = Math.round(((worker.rating * worker.totalReviews) + rating) / total * 10) / 10;
    worker.totalReviews = total;
    // Auto-suspend if rating < 1.0 after 3+ reviews
    if (worker.totalReviews >= 3 && worker.rating < 1.0) {
      worker.isSuspended = true;
      worker.isAvailable = false;
      worker.suspendReason = `Auto-suspended: rating ${worker.rating} below 1.0`;
      const notifyUser = req.app.get('notifyUser');
      if (notifyUser) notifyUser('admin', { type:'WORKER_AUTO_SUSPENDED', title:'Worker Auto-Suspended', message:`${worker.name} suspended (rating: ${worker.rating})`, workerId: worker._id });
    }
    await worker.save();
    job.rating = rating; job.review = review; job.isRated = true; job.ratedAt = new Date();
    if (reviewPhotos && reviewPhotos.length) job.reviewPhotos = reviewPhotos.slice(0, 3);
    await job.save();
    res.json(job);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/bookings', authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ clientId: req.user.id, status: { $in: ['Accepted','In-Progress','Completed'] } })
      .populate('acceptedBy', 'name phone category');
    res.json(jobs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
