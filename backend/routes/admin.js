const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Client = require('../models/Client');
const Job = require('../models/Job');
const Commission = require('../models/Commission');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const guard = [authMiddleware, adminMiddleware];

// GET /api/admin/stats
router.get('/stats', guard, async (req, res) => {
  try {
    const [totalWorkers, totalClients, totalJobs, completedJobs] = await Promise.all([
      Worker.countDocuments(),
      Client.countDocuments(),
      Job.countDocuments(),
      Job.find({ status: 'Completed' }).select('budget')
    ]);
    const today = new Date(); today.setHours(0,0,0,0);
    const todayJobs = await Job.countDocuments({ createdAt: { $gte: today } });
    const totalRevenue = completedJobs.reduce((s, j) => s + (j.budget?.max || 0), 0);
    const pendingCommission = await Commission.aggregate([
      { $match: { isPaid: false } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
    ]);
    res.json({
      totalWorkers, totalClients, totalJobs,
      completedJobs: completedJobs.length,
      totalRevenue, todayJobs,
      pendingCommission: pendingCommission[0]?.total || 0
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/workers
router.get('/workers', guard, async (req, res) => {
  try {
    const workers = await Worker.find().select('-password').sort({ createdAt: -1 });
    res.json(workers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/clients
router.get('/clients', guard, async (req, res) => {
  try {
    const clients = await Client.find().select('-password').sort({ createdAt: -1 });
    const withJobCount = await Promise.all(clients.map(async c => {
      const count = await Job.countDocuments({ clientId: c._id });
      return { ...c.toObject(), totalJobs: count };
    }));
    res.json(withJobCount);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/jobs
router.get('/jobs', guard, async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('clientId', 'name phone email')
      .populate('acceptedBy', 'name phone category')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/admin/workers/:id/suspend
router.patch('/workers/:id/suspend', guard, async (req, res) => {
  try {
    const { reason } = req.body;
    const worker = await Worker.findByIdAndUpdate(req.params.id,
      { isSuspended: true, isVerified: false, isAvailable: false, suspendReason: reason || 'Suspended by admin' },
      { new: true }).select('-password');
    res.json(worker);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/admin/workers/:id/activate
router.patch('/workers/:id/activate', guard, async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id,
      { isSuspended: false, isVerified: true, suspendReason: '' },
      { new: true }).select('-password');
    res.json(worker);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/admin/workers/:id/verify
router.patch('/workers/:id/verify', guard, async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true }).select('-password');
    res.json(worker);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/admin/workers/:id
router.delete('/workers/:id', guard, async (req, res) => {
  try {
    await Worker.findByIdAndDelete(req.params.id);
    res.json({ message: 'Worker deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/admin/clients/:id
router.delete('/clients/:id', guard, async (req, res) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ message: 'Client deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/live-map
router.get('/live-map', guard, async (req, res) => {
  try {
    const workers = await Worker.find({ isAvailable: true }).select('-password');
    const activeJobs = await Job.find({ status: { $in: ['Accepted','In-Progress'] } })
      .populate('clientId', 'name location');
    const workerMap = {};
    activeJobs.forEach(j => { if (j.acceptedBy) workerMap[j.acceptedBy.toString()] = j; });
    const result = workers.map(w => ({
      ...w.toObject(),
      activeJob: workerMap[w._id.toString()] || null
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/commissions
router.get('/commissions', guard, async (req, res) => {
  try {
    const commissions = await Commission.find()
      .populate('jobId', 'title budget')
      .populate('workerId', 'name phone category')
      .populate('clientId', 'name phone')
      .sort({ createdAt: -1 });
    res.json(commissions);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/admin/commissions/:id/mark-paid
router.patch('/commissions/:id/mark-paid', guard, async (req, res) => {
  try {
    const comm = await Commission.findByIdAndUpdate(req.params.id,
      { isPaid: true, paidAt: new Date() }, { new: true });
    res.json(comm);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
