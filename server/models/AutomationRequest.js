const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const automationRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conversation: [conversationSchema],
  status: { type: String, enum: ['pending', 'processed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AutomationRequest', automationRequestSchema);