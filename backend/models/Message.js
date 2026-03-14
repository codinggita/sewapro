const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  jobId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderRole: { type: String, enum: ['client', 'worker'], required: true },
  senderName: { type: String, required: true },
  text:     { type: String, required: true, trim: true },
  read:     { type: Boolean, default: false },
  createdAt:{ type: Date, default: Date.now }
});

messageSchema.index({ jobId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
