const express = require('express');
const authenticateJWT = require('../middleware/auth');
const AutomationRequest = require('../models/AutomationRequest');
const deepseekService = require('../services/deepseek');
const openaiService = require('../services/openai');
const router = express.Router();

router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { userInput, formStructure } = req.body;
    
    if (!userInput || !formStructure) {
      return res.status(400).json({ 
        message: 'Both userInput and formStructure are required' 
      });
    }

    // Create initial request
    const newRequest = await AutomationRequest.create({
      userId: req.user.id,
      conversation: [{
        role: 'user',
        message: userInput
      }],
      formStructure,
      status: 'processing'
    });

    try {
      // Process the form with DeepSeek AI
      const filledFormData = await deepseekService.processFormFilling(
        userInput,
        formStructure
      );
      
      // Update request with results
      newRequest.status = 'completed';
      newRequest.filledFormData = filledFormData;
      newRequest.conversation.push({
        role: 'assistant',
        message: 'Form filled successfully'
      });
    } catch (error) {
      newRequest.status = 'failed';
      newRequest.error = error.message;
      newRequest.conversation.push({
        role: 'assistant',
        message: `Error: ${error.message}`
      });
    }

    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Form processing error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

// New POST route for OpenAI form filling
router.post('/openai/fill-form', authenticateJWT, async (req, res) => {
  try {
    const { userInput, formStructure } = req.body;

    if (!userInput || !formStructure) {
      return res.status(400).json({
        message: 'Both userInput and formStructure are required'
      });
    }

    // Create initial request (or decide if you want a separate model/collection for OpenAI requests)
    // For now, let's reuse AutomationRequest and perhaps add a field to distinguish the AI provider.
    const newRequest = await AutomationRequest.create({
      userId: req.user.id,
      conversation: [{
        role: 'user',
        message: `OpenAI Request: ${userInput}` // Indicate it's an OpenAI request
      }],
      formStructure, // The original structure before AI processing
      status: 'processing',
      // You might want to add a field like 'aiProvider': 'openai'
    });

    try {
      // Process the form with OpenAI AI
      const filledFormData = await openaiService.processFormFillingWithOpenAI(
        userInput,
        formStructure // Pass the whole PageStructure-like object
      );

      // Update request with results
      newRequest.status = 'completed';
      newRequest.filledFormData = filledFormData; // This will store the PageStructure-like object with AI-filled values
      newRequest.conversation.push({
        role: 'assistant',
        message: 'Form filled successfully by OpenAI'
      });
    } catch (error) {
      newRequest.status = 'failed';
      newRequest.error = error.message;
      newRequest.conversation.push({
        role: 'assistant',
        message: `OpenAI Error: ${error.message}`
      });
    }

    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    console.error('OpenAI Form processing error:', error);
    res.status(500).json({
      message: 'Internal server error during OpenAI processing',
      error: error.message
    });
  }
});

// Get all requests for the user
router.get('/', authenticateJWT, async (req, res) => {
  const requests = await AutomationRequest.find({ userId: req.user.id });
  res.json(requests);
});

// Get a specific request
router.get('/:id', authenticateJWT, async (req, res) => {
  const request = await AutomationRequest.findOne({ _id: req.params.id, userId: req.user.id });
  if (!request) return res.sendStatus(404);
  res.json(request);
});

// New POST route for mapping user input to form using the detailed pre-prompt
router.post('/openai/map-form', authenticateJWT, async (req, res) => {
  try {
    const { userInput, pageStructure } = req.body; // pageStructure here is your client-side PageStructure interface

    if (!userInput || !pageStructure) {
      return res.status(400).json({
        message: 'Both userInput and pageStructure are required'
      });
    }
    if (!pageStructure.formStructure || !Array.isArray(pageStructure.formStructure)) {
      return res.status(400).json({
        message: 'pageStructure must contain a formStructure array.'
      });
    }

    // We don't necessarily need to save this as an AutomationRequest unless you want to log it.
    // This example directly calls the service and returns the result.
    // If you want to log it, you would create an AutomationRequest entry here.

    const mappedFormData = await openaiService.mapUserInputToForm(
      userInput,
      pageStructure // Pass the full PageStructure object as defined on your client
    );

    res.status(200).json(mappedFormData); // Send back the AI's structured response

  } catch (error) {
    console.error('OpenAI Map Form processing error:', error);
    res.status(500).json({
      message: 'Internal server error during OpenAI form mapping',
      error: error.message
    });
  }
});

module.exports = router;