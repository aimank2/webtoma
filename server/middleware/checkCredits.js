const User = require("../models/User");
const { getPlanDetails } = require("../config/plans"); // We'll use this later for more advanced checks

async function checkCredits(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    // Attach full user object to request for later use in routes
    req.currentUser = user;

    if (user.credits <= 0) {
      return res.status(403).json({
        message:
          "Insufficient credits. Please upgrade your plan or wait for the next reset.",
        creditsRemaining: user.credits,
      });
    }

    // Optional: Add checks for trial expiry or other subscription statuses here
    // For example, if user.subscription_type === 'trial' and trial has expired.

    next();
  } catch (error) {
    console.error("Credit check error:", error);
    res.status(500).json({ message: "Server error during credit check." });
  }
}

module.exports = checkCredits;
