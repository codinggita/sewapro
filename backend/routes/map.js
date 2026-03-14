const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/map/nearby-workers?lat=&lng=&category=&radius=
router.get('/nearby-workers', authMiddleware, async (req, res) => {
  try {
    const { lat, lng, category, radius = 10000 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and Longitude are required' });
    }

    const filter = {
      isAvailable: true,
      liveLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius)
        }
      }
    };

    if (category && category !== 'all') {
      filter.category = category;
    }

    const workers = await Worker.find(filter).select('-password');
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/map/workers — All available workers
router.get('/workers', async (req, res) => {
  try {
    const workers = await Worker.find({ 
      isAvailable: true
    }).select('name category rating pricePerHour liveLocation profilePhoto city');
    
    console.log('Total available workers:', workers.length);
    
    // Filter workers with valid location for response
    const workersWithLocation = workers.filter(w => {
      const coords = w.liveLocation?.coordinates;
      return coords && Array.isArray(coords) && 
             coords.length === 2 && 
             (coords[0] !== 0 || coords[1] !== 0);
    });
    
    console.log('Workers with valid location:', workersWithLocation.length);
    
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
