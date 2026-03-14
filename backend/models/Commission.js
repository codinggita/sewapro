const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  jobId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  workerId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  clientId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  jobAmount:        Number,
  commissionRate:   { type: Number, default: 0.10 },
  commissionAmount: Number,
  qrCode:           String,
  qrData:           String,
  isPaid:           { type: Boolean, default: false },
  paidAt:           Date,
  createdAt:        { type: Date, default: Date.now }
});

module.exports = mongoose.model('Commission', commissionSchema);
