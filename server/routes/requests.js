const express = require('express');
const authenticateJWT = require('../middleware/auth');
const AutomationRequest = require('../models/AutomationRequest');
const router = express.Router();

router.post('/', authenticateJWT, async (req, res) => {
  const { conversation } = req.body;
  const newRequest = await AutomationRequest.create({
    userId: req.user.id,
    conversation,
    status: 'pending'
  });
  res.status(201).json(newRequest);
});

router.get('/', authenticateJWT, async (req, res) => {
  const requests = await AutomationRequest.find({ userId: req.user.id });
  res.json(requests);
});

router.get('/:id', authenticateJWT, async (req, res) => {
  const request = await AutomationRequest.findOne({ _id: req.params.id, userId: req.user.id });
  if (!request) return res.sendStatus(404);
  res.json(request);
});

module.exports = router;