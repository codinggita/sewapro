const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const workerSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  password:     { type: String, required: true },
  phone:        { type: String, required: true },
  role:         { type: String, default: 'worker' },
  category:     { type: String, enum: ['Plumber','Electrician','Carpenter','Painter','Mason','Welder'], required: true },
  experience:   { type: Number, default: 0 },
  pricePerHour: { type: Number, default: 100 },
  skills:       [String],
  bio:          String,
  profilePhoto: { type: String, default: '' },
  idProof:      { type: String, default: '' },
  city:         String,
  address:      String,
  isVerified:   { type: Boolean, default: true },
  isAvailable:  { type: Boolean, default: false },
  isSuspended:  { type: Boolean, default: false },
  suspendReason:{ type: String, default: '' },
  liveLocation: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  searchRadius:  { type: Number, default: 20, min: 5, max: 100 },
  rating:        { type: Number, default: 0 },
  totalReviews:  { type: Number, default: 0 },
  totalJobsDone: { type: Number, default: 0 },
  availabilitySchedule: {
    monday:    { type: Boolean, default: true },
    tuesday:   { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday:  { type: Boolean, default: true },
    friday:    { type: Boolean, default: true },
    saturday:  { type: Boolean, default: true },
    sunday:    { type: Boolean, default: false }
  },
  workingHours: {
    start: { type: String, default: '08:00' },
    end:   { type: String, default: '20:00' }
  },
  portfolio: [{
    photoUrl:   String,
    caption:    String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

workerSchema.index({ liveLocation: '2dsphere' });

workerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('Worker', workerSchema);
