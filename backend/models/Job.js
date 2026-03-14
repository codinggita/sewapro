const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: String,
  category:    { type: String, enum: ['Plumber','Electrician','Carpenter','Painter','Mason','Welder'], required: true },
  priority:    { type: String, enum: ['Normal','Urgent'], default: 'Normal' },
  isEmergency: { type: Boolean, default: false },
  location: {
    address: String,
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  scheduledDate:  Date,
  scheduledTime:  String,
  estimatedHours: Number,
  budget: { min: Number, max: Number },
  status: { type: String, enum: ['Pending','Accepted','In-Progress','Completed','Cancelled'], default: 'Pending' },
  clientId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  workerRequests:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
  acceptedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  acceptedAt:    Date,
  startedAt:     Date,
  completedAt:   Date,
  rejectedBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
  isRated:       { type: Boolean, default: false },
  rating:        Number,
  review:        String,
  reviewPhotos:  [String],
  ratedAt:       Date,
  createdAt:     { type: Date, default: Date.now }
});

jobSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Job', jobSchema);
