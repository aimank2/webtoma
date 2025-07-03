const express = require("express");
const router = express.Router();
const OpenAIService = require("../services/openai");

// POST /api/ai/sheet-planner
router.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required." });
    }
    const tasks = await OpenAIService.mapPromptToSheetTasks(prompt);
    res.json(tasks);
  } catch (error) {
    console.error("Sheet Planner Error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
});

module.exports = router;
