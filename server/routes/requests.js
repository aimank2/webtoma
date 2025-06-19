const express = require("express");
const authenticateJWT = require("../middleware/auth");
const checkCredits = require("../middleware/checkCredits"); // Import checkCredits middleware
const User = require("../models/User"); // Import User model
const AutomationRequest = require("../models/AutomationRequest");
const deepseekService = require("../services/deepseek");
const openaiService = require("../services/openai");
const router = express.Router();

router.post("/", authenticateJWT, checkCredits, async (req, res) => {
  try {
    const { userInput, formStructure } = req.body;

    if (!userInput || !formStructure) {
      return res.status(400).json({
        message: "Both userInput and formStructure are required",
      });
    }

    // Create initial request
    const newRequest = await AutomationRequest.create({
      userId: req.user.id,
      conversation: [
        {
          role: "user",
          message: userInput,
        },
      ],
      formStructure,
      status: "processing",
    });

    try {
      // Process the form with DeepSeek AI
      const { result: filledFormData, usage: deepseekUsage } =
        await deepseekService.processFormFilling(userInput, formStructure);

      // Deduct credits
      const tokensUsed = deepseekUsage.total_tokens;
      const creditsToDeduct = Math.ceil(tokensUsed / 1000); // Apply your intended calculation

      console.log(
        `User ID: ${req.user.id}, Tokens Used: ${tokensUsed}, Credits to Deduct: ${creditsToDeduct}`
      ); // Logging for debug

      const user = await User.findById(req.user.id);
      if (user) {
        console.log(`User ${user.email} current credits: ${user.credits}`);
        if (user.credits < creditsToDeduct) {
          // This case should ideally be caught by checkCredits middleware first.
          // If it reaches here, it means checkCredits might have allowed it based on pre-deduction credits.
          // We'll set credits to 0 and potentially log/handle this specific scenario.
          console.warn(
            `User ${user.email} had ${user.credits} credits, but operation required ${creditsToDeduct}. Setting credits to 0.`
          );
          user.credits_used_this_month += user.credits; // Add remaining credits to used amount
          user.credits = 0;
        } else {
          user.credits -= creditsToDeduct;
          user.credits_used_this_month += creditsToDeduct;
        }
        await user.save();
        console.log(
          `User ${user.email} new credits: ${user.credits}, used this month: ${user.credits_used_this_month}`
        );
      } else {
        // Handle case where user is not found, though unlikely if authenticateJWT passed
        console.error("User not found for credit deduction:", req.user.id);
        // Potentially throw an error or return a specific response
      }

      // Update request with results
      newRequest.status = "completed";
      newRequest.filledFormData = filledFormData;
      newRequest.conversation.push({
        role: "assistant",
        message: "Form filled successfully",
      });
    } catch (error) {
      newRequest.status = "failed";
      newRequest.error = error.message;
      newRequest.conversation.push({
        role: "assistant",
        message: `Error: ${error.message}`,
      });
    }

    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    console.error("Form processing error:", error);
    // Check if the error is from checkCredits middleware
    if (
      error.message === "Insufficient credits" ||
      error.message === "Credit limit exceeded"
    ) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// New POST route for OpenAI form filling
router.post(
  "/openai/fill-form",
  authenticateJWT,
  checkCredits,
  async (req, res) => {
    try {
      const { userInput, formStructure } = req.body;

      if (!userInput || !formStructure) {
        return res.status(400).json({
          message: "Both userInput and formStructure are required",
        });
      }

      // Create initial request (or decide if you want a separate model/collection for OpenAI requests)
      // For now, let's reuse AutomationRequest and perhaps add a field to distinguish the AI provider.
      const newRequest = await AutomationRequest.create({
        userId: req.user.id,
        conversation: [
          {
            role: "user",
            message: `OpenAI Request: ${userInput}`, // Indicate it's an OpenAI request
          },
        ],
        formStructure, // The original structure before AI processing
        status: "processing",
        // You might want to add a field like 'aiProvider': 'openai'
      });

      try {
        // Process the form with OpenAI AI
        // Assuming processFormFillingWithOpenAI is updated to return { result, usage }
        const { result: filledFormData, usage: openaiUsage } =
          await openaiService.processFormFillingWithOpenAI(
            userInput,
            formStructure // Pass the whole PageStructure-like object
          );

        // Deduct credits
        const creditsToDeduct = openaiUsage.total_tokens; // Assuming 1 token = 1 credit
        const user = await User.findById(req.user.id);
        if (user) {
          user.credits -= creditsToDeduct;
          user.credits_used_this_month += creditsToDeduct;
          await user.save();
        } else {
          console.error("User not found for credit deduction:", req.user.id);
        }

        // Update request with results
        newRequest.status = "completed";
        newRequest.filledFormData = filledFormData; // This will store the PageStructure-like object with AI-filled values
        newRequest.conversation.push({
          role: "assistant",
          message: "Form filled successfully by OpenAI",
        });
      } catch (error) {
        newRequest.status = "failed";
        newRequest.error = error.message;
        newRequest.conversation.push({
          role: "assistant",
          message: `OpenAI Error: ${error.message}`,
        });
      }

      await newRequest.save();
      res.status(201).json(newRequest);
    } catch (error) {
      console.error("OpenAI Form processing error:", error);
      // Check if the error is from checkCredits middleware
      if (
        error.message === "Insufficient credits" ||
        error.message === "Credit limit exceeded"
      ) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({
        message: "Internal server error during OpenAI processing",
        error: error.message,
      });
    }
  }
);

// Get all requests for the user
router.get("/", authenticateJWT, async (req, res) => {
  const requests = await AutomationRequest.find({ userId: req.user.id });
  res.json(requests);
});

// Get a specific request
router.get("/:id", authenticateJWT, async (req, res) => {
  const request = await AutomationRequest.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });
  if (!request) return res.sendStatus(404);
  res.json(request);
});

// New POST route for mapping user input to form using the detailed pre-prompt
router.post(
  "/openai/map-form",
  authenticateJWT,
  checkCredits,
  async (req, res) => {
    try {
      const { userInput, pageStructure } = req.body; // pageStructure here is your client-side PageStructure interface

      if (!userInput || !pageStructure) {
        return res.status(400).json({
          message: "Both userInput and pageStructure are required",
        });
      }
      if (
        !pageStructure.formStructure ||
        !Array.isArray(pageStructure.formStructure)
      ) {
        return res.status(400).json({
          message: "pageStructure must contain a formStructure array.",
        });
      }

      // Correctly destructure the response from the service
      const {
        mappedForm,
        usage: openaiUsage,
      } = // Changed 'result: mappedFormData' to 'mappedForm'
        await openaiService.mapUserInputToForm(
          userInput,
          pageStructure // Pass the full PageStructure object as defined on your client
        );

      // Deduct credits (ensure openaiUsage and total_tokens are available)
      // Add a check for openaiUsage and openaiUsage.total_tokens before deducting
      if (openaiUsage && typeof openaiUsage.total_tokens === "number") {
        const creditsToDeduct = Math.ceil(openaiUsage.total_tokens / 1000); // Or your specific logic
        console.log(
          `OpenAI Map Form: User ID: ${req.user.id}, Tokens Used: ${openaiUsage.total_tokens}, Credits to Deduct: ${creditsToDeduct}`
        );
        const user = await User.findById(req.user.id);
        if (user) {
          console.log(
            `OpenAI Map Form: User ${user.email} current credits: ${user.credits}`
          );
          if (user.credits < creditsToDeduct) {
            console.warn(
              `OpenAI Map Form: User ${user.email} had ${user.credits} credits, but operation required ${creditsToDeduct}. Setting credits to 0.`
            );
            user.credits_used_this_month += user.credits;
            user.credits = 0;
          } else {
            user.credits -= creditsToDeduct;
            user.credits_used_this_month += creditsToDeduct;
          }
          await user.save();
          console.log(
            `OpenAI Map Form: User ${user.email} new credits: ${user.credits}, used this month: ${user.credits_used_this_month}`
          );
        } else {
          console.error(
            "OpenAI Map Form: User not found for credit deduction:",
            req.user.id
          );
        }
      } else {
        console.warn(
          "OpenAI Map Form: openaiUsage.total_tokens not available, skipping credit deduction.",
          openaiUsage
        );
      }

      // Send back the AI's structured response, which is in 'mappedForm'
      res.status(200).json(mappedForm); // Changed 'mappedFormData' to 'mappedForm'
    } catch (error) {
      console.error("OpenAI Map Form processing error:", error);
      // Check if the error is from checkCredits middleware
      if (
        error.message === "Insufficient credits" ||
        error.message === "Credit limit exceeded"
      ) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({
        message: "Internal server error during OpenAI form mapping",
        error: error.message,
      });
    }
  }
);

module.exports = router;
