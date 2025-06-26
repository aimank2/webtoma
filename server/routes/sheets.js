const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/auth');
const checkCredits = require('../middleware/checkCredits');
const sheetClassifier = require('../services/sheetClassifier');
const sheetAutomation = require('../services/sheetAutomation');

router.post('/classify', authenticateJWT, checkCredits, async (req, res) => {
  try {
    const { prompt } = req.body;
    const classification = await sheetClassifier.classifyIntent(prompt);
    res.json(classification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/automate', authenticateJWT, checkCredits, async (req, res) => {
  try {
    const { intent, prompt, sheetMetadata } = req.body;
    const result = await sheetAutomation.processAutomation(
      intent,
      prompt,
      sheetMetadata
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;