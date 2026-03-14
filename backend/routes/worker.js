const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Job = require('../models/Job');
const Commission = require('../models/Commission');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/worker/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const worker = await Worker.findById(req.user.id).select('-password');
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    res.json(worker);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/worker/analytics
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ acceptedBy: req.user.id, status: 'Completed' }).sort({ completedAt: -1 });
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const earningsByDay = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      earningsByDay[d.toISOString().split('T')[0]] = 0;
    }
    jobs.filter(j => new Date(j.completedAt) >= sevenDaysAgo).forEach(j => {
      const d = new Date(j.completedAt).toISOString().split('T')[0];
      if (earningsByDay[d] !== undefined) earningsByDay[d] += (j.budget?.max || 0);
    });
    const earningsByDayArr = Object.entries(earningsByDay).map(([date, amount]) => ({ date, amount }));
    const peakHoursMap = {};
    jobs.forEach(j => {
      const h = new Date(j.createdAt).getHours();
      peakHoursMap[h] = (peakHoursMap[h] || 0) + 1;
    });
    const peakHours = Object.entries(peakHoursMap).map(([hour, count]) => ({ hour: Number(hour), count })).sort((a,b) => a.hour - b.hour);
    const ratedJobs = jobs.filter(j => j.isRated && j.rating).slice(0, 10);
    const ratingTrend = ratedJobs.map(j => ({ jobId: j._id, rating: j.rating, date: j.ratedAt || j.completedAt }));
    res.json({ earningsByDay: earningsByDayArr, peakHours, ratingTrend });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/worker/nearby-jobs
router.get('/nearby-jobs', authMiddleware, async (req, res) => {
  try {
    const worker = await Worker.findById(req.user.id);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const today = days[new Date().getDay()];
    if (worker.availabilitySchedule && !worker.availabilitySchedule[today]) {
      return res.json([]);
    }
    const workerCoords = worker.liveLocation?.coordinates || [0, 0];
    const hasLocation = workerCoords[0] !== 0 || workerCoords[1] !== 0;
    const radiusMeters = (worker.searchRadius || 20) * 1000;
    const query = { status: 'Pending', category: worker.category, rejectedBy: { $nin: [worker._id] } };
    let jobs;
    if (hasLocation) {
      try {
        query['location'] = { $near: { $geometry: { type:'Point', coordinates: workerCoords }, $maxDistance: radiusMeters } };
        jobs = await Job.find(query).populate('clientId', 'name phone city address').limit(20);
      } catch { delete query['location']; jobs = await Job.find(query).populate('clientId','name phone city address').sort({ createdAt: -1 }).limit(20); }
    } else {
      jobs = await Job.find(query).populate('clientId','name phone city address').sort({ createdAt: -1 }).limit(20);
    }
    const jobsWithDistance = jobs.map(job => {
      const j = job.toObject();
      if (hasLocation && j.location?.coordinates?.[0] !== 0) {
        const [lng2,lat2] = j.location.coordinates; const [lng1,lat1] = workerCoords;
        const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
        const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
        j.distanceKm = Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))*10)/10;
      }
      return j;
    });
    jobsWithDistance.sort((a,b) => (b.isEmergency?1:0)-(a.isEmergency?1:0));
    res.json(jobsWithDistance);
  } catch (err) { res.status(500).json({ message: 'Failed: '+err.message }); }
});

// GET /api/worker/active-jobs
router.get('/active-jobs', authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ acceptedBy: req.user.id, status: { $in: ['Accepted','In-Progress'] } })
      .populate('clientId','name phone city profilePhoto');
    res.json(jobs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/worker/earnings
router.get('/earnings', authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ acceptedBy: req.user.id, status: 'Completed' }).populate('clientId','name');
    const totalEarnings = jobs.reduce((s,j) => s+(j.budget?.max||0), 0);
    res.json({ jobs, totalEarnings });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/worker/my-commissions
router.get('/my-commissions', authMiddleware, async (req, res) => {
  try {
    const commissions = await Commission.find({ workerId: req.user.id })
      .populate('jobId','title budget').sort({ createdAt: -1 });
    res.json(commissions);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/worker/availability
router.patch('/availability', authMiddleware, async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const update = { isAvailable };
    if (!isAvailable) update['liveLocation.coordinates'] = [0,0];
    const worker = await Worker.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    res.json({ isAvailable: worker.isAvailable });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/worker/location
router.patch('/location', authMiddleware, async (req, res) => {
  try {
    const { coordinates } = req.body;
    await Worker.findByIdAndUpdate(req.user.id, { 'liveLocation.type':'Point', 'liveLocation.coordinates': coordinates });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/worker/search-radius
router.patch('/search-radius', authMiddleware, async (req, res) => {
  try {
    const { radius } = req.body;
    if (!radius||radius<5||radius>100) return res.status(400).json({ message:'Radius must be 5-100km' });
    const worker = await Worker.findByIdAndUpdate(req.user.id, { searchRadius: radius }, { new: true }).select('-password');
    res.json({ searchRadius: worker.searchRadius });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/worker/schedule
router.patch('/schedule', authMiddleware, async (req, res) => {
  try {
    const { availabilitySchedule, workingHours } = req.body;
    const worker = await Worker.findByIdAndUpdate(req.user.id, { availabilitySchedule, workingHours }, { new: true }).select('-password');
    res.json(worker);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/worker/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, pricePerHour, bio, experience, city } = req.body;
    const worker = await Worker.findByIdAndUpdate(req.user.id, { name, phone, pricePerHour, bio, experience, city }, { new: true }).select('-password');
    res.json(worker);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/worker/portfolio
router.post('/portfolio', authMiddleware, async (req, res) => {
  try {
    const { photoUrl, caption } = req.body;
    const worker = await Worker.findById(req.user.id);
    if (worker.portfolio.length >= 6) return res.status(400).json({ message: 'Max 6 portfolio photos allowed' });
    worker.portfolio.push({ photoUrl, caption });
    await worker.save();
    res.json(worker.portfolio);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/worker/portfolio/:index
router.delete('/portfolio/:index', authMiddleware, async (req, res) => {
  try {
    const worker = await Worker.findById(req.user.id);
    worker.portfolio.splice(Number(req.params.index), 1);
    await worker.save();
    res.json(worker.portfolio);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/worker/jobs/:id/accept
router.post('/jobs/:id/accept', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message:'Job not found' });
    if (job.status !== 'Pending') return res.status(400).json({ message:'Job already accepted' });
    job.status = 'Accepted'; job.acceptedBy = req.user.id; job.acceptedAt = new Date();
    await job.save();
    const updatedJob = await Job.findById(job._id).populate('clientId','name phone city');
    const notifyUser = req.app.get('notifyUser');
    if (notifyUser) notifyUser(job.clientId.toString(), { type:'JOB_ACCEPTED', title:'Job Accepted!', message:`Your job "${job.title}" has been accepted`, jobId: job._id });
    res.json(updatedJob);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/worker/jobs/:id/reject
router.post('/jobs/:id/reject', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { $addToSet: { rejectedBy: req.user.id } }, { new: true });
    res.json({ message:'Job rejected' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/worker/jobs/:id/complete
router.patch('/jobs/:id/complete', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, acceptedBy: req.user.id });
    if (!job) return res.status(404).json({ message:'Job not found' });
    job.status = 'Completed'; job.completedAt = new Date();
    await job.save();
    const worker = await Worker.findByIdAndUpdate(req.user.id, { $inc: { totalJobsDone: 1 }, isAvailable: true }, { new: true });
    // Generate QR for commission
    let qrCode = null;
    try {
      const QRCode = require('qrcode');
      const commissionAmount = Math.round((job.budget?.max || 0) * 0.10);
      const qrData = JSON.stringify({
        jobId: job._id, worker: worker.name, amount: job.budget?.max,
        commission: commissionAmount, payTo: 'SewaPro Admin', upiId: 'sewapro@upi',
        timestamp: new Date().toISOString()
      });
      qrCode = await QRCode.toDataURL(qrData);
      await Commission.create({
        jobId: job._id, workerId: req.user.id, clientId: job.clientId,
        jobAmount: job.budget?.max, commissionRate: 0.10, commissionAmount, qrCode, qrData
      });
    } catch(qrErr) { console.log('QR skipped:', qrErr.message); }
    const notifyUser = req.app.get('notifyUser');
    if (notifyUser) notifyUser(job.clientId.toString(), { type:'JOB_COMPLETED', title:'Job Completed!', message:`"${job.title}" marked complete. Please rate the worker.`, jobId: job._id });
    res.json({ job, qrCode });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/worker/jobs/:id/tracking
router.get('/jobs/:id/tracking', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, acceptedBy: req.user.id })
      .populate('clientId','name phone profilePhoto city address')
      .populate('acceptedBy','name phone profilePhoto category rating liveLocation');
    if (!job) return res.status(404).json({ message:'Job not found' });
    res.json(job);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/worker (public list)
router.get('/', async (req, res) => {
  try {
    const { page=1, limit=8, category, city, isAvailable, sort } = req.query;
    const filter = {};
    if (category&&category!=='all') filter.category = category;
    if (city) filter.city = new RegExp(city,'i');
    if (isAvailable!==undefined&&isAvailable!=='all') filter.isAvailable = isAvailable==='true';
    filter.isSuspended = { $ne: true };
    let sortObj = { createdAt: -1 };
    if (sort==='rating') sortObj = { rating: -1 };
    if (sort==='price') sortObj = { pricePerHour: 1 };
    const total = await Worker.countDocuments(filter);
    const workers = await Worker.find(filter).sort(sortObj).skip((page-1)*limit).limit(Number(limit)).select('-password');
    res.json({ workers, currentPage: Number(page), totalPages: Math.ceil(total/limit), totalWorkers: total });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/worker/nearby (public)
router.get('/nearby', async (req, res) => {
  try {
    const { lng, lat, maxDistance=10000, category } = req.query;
    const filter = { isAvailable: true, isVerified: true, isSuspended: { $ne: true },
      liveLocation: { $near: { $geometry: { type:'Point', coordinates:[Number(lng),Number(lat)] }, $maxDistance: Number(maxDistance) } }
    };
    if (category&&category!=='all') filter.category = category;
    const workers = await Worker.find(filter).select('-password');
    res.json(workers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/worker/:id — MUST BE LAST
router.get('/:id', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id).select('-password');
    if (!worker) return res.status(404).json({ message:'Worker not found' });
    res.json(worker);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
