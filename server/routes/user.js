const express = require("express");
const router = express.Router();
const authenticateJWT = require("../middleware/auth");
const User = require("../models/User");
const plans = require("../config/plans"); // Import plans to get default limits

// GET user profile (replaces existing /me or can be a new /profile route)
router.get("/profile", authenticateJWT, async (req, res) => {
  try {
    console.log("req.user.id:", req.user.id);
    const userFromDb = await User.findById(req.user.id).select("-password");
    console.log("userFromDb:", userFromDb);
    if (!userFromDb) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure all necessary fields are present, providing defaults if not
    // This is especially for users created before the credit system fields were added
    const planName = userFromDb.subscription_type || "free";
    const planDetails = plans[planName] || plans.free; // Fallback to free plan details

    const profileData = {
      _id: userFromDb._id,
      googleId: userFromDb.googleId,
      email: userFromDb.email,
      name: userFromDb.name || "N/A",
      avatar: userFromDb.avatar,
      createdAt: userFromDb.createdAt,
      credits:
        typeof userFromDb.credits === "number"
          ? userFromDb.credits
          : planDetails.monthly_credit_limit,
      subscription_type: planName,
      monthly_credit_limit:
        typeof userFromDb.monthly_credit_limit === "number"
          ? userFromDb.monthly_credit_limit
          : planDetails.monthly_credit_limit,
      credits_used_this_month:
        typeof userFromDb.credits_used_this_month === "number"
          ? userFromDb.credits_used_this_month
          : 0,
      last_reset: userFromDb.last_reset || new Date(), // Default to now if not set
    };

    res.json(profileData);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// If you still have a /me route, you might want to update it similarly or remove it if /profile replaces it.
// router.get('/me', authenticateJWT, async (req, res) => { ... });

module.exports = router;
