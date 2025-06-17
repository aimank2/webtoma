const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const automationRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conversation: [conversationSchema],
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  formStructure: { type: Object, required: true }, // Store the original form structure
  filledFormData: { type: Object }, // Store the AI-generated form data
  error: { type: String }, // Store any error messages
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AutomationRequest', automationRequestSchema);