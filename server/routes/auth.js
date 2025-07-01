const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // Added bcrypt
const User = require("../models/User");
const plansConfig = require("../config/plans");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../services/emailService"); // Import the service

const router = express.Router();

// Function to generate a 4-character verification code
function generateVerificationCode() {
  return crypto.randomBytes(2).toString("hex").toUpperCase(); // Generates 4 hex characters
}

// --- Google OAuth Routes (existing) ---

// --- Email/Password Auth Routes (new) ---

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.isVerified) {
      return res
        .status(400)
        .json({ message: "Email already in use and verified." });
    }
    if (existingUser && !existingUser.isVerified) {
      // If user exists but not verified, update their info and resend code
      existingUser.name = name;
      existingUser.password = password; // Password will be re-hashed by pre-save hook
      existingUser.verificationCode = generateVerificationCode();
      existingUser.verificationCodeExpires = new Date(
        Date.now() + 10 * 60 * 1000
      ); // 10 minutes
      await existingUser.save();

      // Don't await, let it run in the background
      sendVerificationEmail(
        existingUser.email,
        existingUser.verificationCode
      ).catch((err) =>
        console.error(
          "Failed to send verification email (background process):",
          err
        )
      );

      // Respond to client immediately
      return res.status(200).json({
        message:
          "User already exists but was not verified. A new verification code has been sent.",
        email: existingUser.email, // Important for client to redirect
      });
    }

    const defaultPlanName = plansConfig.DEFAULT_PLAN;
    const defaultPlan = plansConfig.PLANS[defaultPlanName];

    if (!defaultPlan) {
      console.error(`Default plan '${defaultPlanName}' not found in plans.js.`);
      return res
        .status(500)
        .json({
          message:
            "Server configuration error during signup. Default plan not found.",
        });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const newUser = new User({
      name,
      email: normalizedEmail,
      password: password,
      subscription_type: defaultPlanName,
      credits: defaultPlan.monthly_credit_limit,
      monthly_credit_limit: defaultPlan.monthly_credit_limit,
      credits_used_this_month: 0,
      last_reset: new Date(),
      isVerified: false,
      verificationCode,
      verificationCodeExpires,
    });

    await newUser.save();

    // Don't await, let it run in the background
    sendVerificationEmail(newUser.email, newUser.verificationCode).catch(
      (err) =>
        console.error(
          "Failed to send verification email (background process):",
          err
        )
    );

    // Respond to client immediately
    res.status(201).json({
      message:
        "User registered successfully. Please check your email to verify your account.",
      email: newUser.email, // Important for client to redirect
    });
  } catch (error) {
    console.error("Signup error:", error);
    // Check for Mongoose duplicate key error (code 11000)
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res
        .status(400)
        .json({ message: "Email already in use (database constraint)." });
    }
    // Handle email sending failure specifically if needed
    if (error.message === "Failed to send verification email.") {
      // Potentially, you might want to still create the user but inform them about the email issue
      // Or, rollback user creation if email is critical for the first step.
      // For now, we'll send a generic server error but log the specific one.
      console.error(
        "Critical: Failed to send verification email during signup."
      );
    }
    res.status(500).json({ message: "Server error during signup." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // If user signed up with Google, they might not have a password
    if (!user.password && user.googleId) {
      // Check for googleId as well
      return res
        .status(401)
        .json({
          message:
            "Please log in with Google, as this account was created via Google Sign-In.",
        });
    }

    // If user has a password (meaning email/password signup) but is not verified
    if (user.password && !user.isVerified) {
      return res
        .status(403)
        .json({
          message: "Please verify your email before logging in.",
          needsVerification: true,
          email: user.email,
        });
    }

    const isMatch = await user.comparePassword(password); // Use the method from User model
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        credits: user.credits, // Send credit info on login too
        subscription_type: user.subscription_type,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// POST /api/auth/verify-email
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res
        .status(400)
        .json({ message: "Email and verification code are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified." });
    }

    if (user.verificationCode !== code.toUpperCase()) {
      return res.status(400).json({ message: "Invalid verification code." });
    }

    if (new Date() > user.verificationCodeExpires) {
      return res.status(400).json({ message: "Verification code expired." });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    // Log user in automatically
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Email verified successfully. You are now logged in.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        credits: user.credits,
        subscription_type: user.subscription_type,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res
      .status(500)
      .json({ message: "Server error during email verification." });
  }
});

// POST /api/auth/resend-code
router.post("/resend-code", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified." });
    }

    // Optional: Add a cooldown period for resending (e.g., 60 seconds)
    // This would require storing the last code sent time or similar.
    // For simplicity, this example doesn't include a strict cooldown beyond code expiry.

    user.verificationCode = generateVerificationCode();
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendVerificationEmail(user.email, user.verificationCode);

    res.json({
      message: "New verification code sent. Please check your email.",
    });
  } catch (error) {
    console.error("Resend code error:", error);
    if (error.message === "Failed to send verification email.") {
      console.error("Critical: Failed to resend verification email.");
    }
    res.status(500).json({ message: "Server error during resend code." });
  }
});

// New route to handle access_token-based authentication
// Add these imports at the top of the file
const { OAuth2Client } = require("google-auth-library");

// Initialize the OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Add this new route
router.post("/google", async (req, res) => {
  try {
    const { id_token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
        isVerified: true,
      });
    } else {
      user.name = payload.name;
      user.avatar = payload.picture;
      await user.save();
    }
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({ token: jwtToken });
  } catch (error) {
    console.error("Google authentication error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
});

module.exports = router;
