const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Job = require('../models/Job');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/chat/:jobId — fetch all messages for a job
router.get('/:jobId', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Only client or assigned worker can see messages
    const isClient = job.clientId.toString() === req.user.id;
    const isWorker = job.acceptedBy?.toString() === req.user.id;
    if (!isClient && !isWorker) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ jobId: req.params.jobId })
      .sort({ createdAt: 1 });

    // Mark messages from other side as read
    await Message.updateMany(
      { jobId: req.params.jobId, senderId: { $ne: req.user.id }, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chat/:jobId — send a message
router.post('/:jobId', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message cannot be empty' });

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const isClient = job.clientId.toString() === req.user.id;
    const isWorker = job.acceptedBy?.toString() === req.user.id;
    if (!isClient && !isWorker) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = await Message.create({
      jobId: req.params.jobId,
      senderId: req.user.id,
      senderRole: req.user.role,
      senderName: req.user.name,
      text: text.trim()
    });

    // Emit via Socket.io if available
    const io = req.app.get('io');
    if (io) {
      io.to(`job_${req.params.jobId}`).emit('new_message', message);
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chat/unread/count — unread message count for current user
router.get('/unread/count', authMiddleware, async (req, res) => {
  try {
    // Find all jobs involving this user
    const jobFilter = req.user.role === 'client'
      ? { clientId: req.user.id }
      : { acceptedBy: req.user.id };

    const jobs = await Job.find(jobFilter).select('_id');
    const jobIds = jobs.map(j => j._id);

    const count = await Message.countDocuments({
      jobId: { $in: jobIds },
      senderId: { $ne: req.user.id },
      read: false
    });

    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
