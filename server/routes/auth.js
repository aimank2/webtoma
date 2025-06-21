const express = require("express");
const passport = require("../passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // Added bcrypt
const User = require("../models/User");
const plansConfig = require('../config/plans');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../services/emailService'); // Import the service

const router = express.Router();

// Function to generate a 4-character verification code
function generateVerificationCode() {
  return crypto.randomBytes(2).toString('hex').toUpperCase(); // Generates 4 hex characters
}

// --- Google OAuth Routes (existing) ---
router.get( // Changed drouter to router here
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect:
      process.env.FRONTEND_URL || "http://localhost:3000/auth-failed",
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, name: req.user.name, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    const extensionRedirectUrl = process.env.CHROME_EXTENSION_REDIRECT_URI;
    if (!extensionRedirectUrl) {
      console.error("CHROME_EXTENSION_REDIRECT_URI is not set in .env");
      return res
        .status(500)
        .send("Server configuration error: Missing extension redirect URI");
    }
    res.redirect(`${extensionRedirectUrl}?token=${token}`);
  }
);

// --- Email/Password Auth Routes (new) ---

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: "Email already in use and verified." });
    }
    if (existingUser && !existingUser.isVerified) {
      // If user exists but not verified, update their info and resend code
      existingUser.name = name;
      existingUser.password = password; // Password will be re-hashed by pre-save hook
      existingUser.verificationCode = generateVerificationCode();
      existingUser.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await existingUser.save();
      
      // Don't await, let it run in the background
      sendVerificationEmail(existingUser.email, existingUser.verificationCode)
        .catch(err => console.error("Failed to send verification email (background process):", err));
      
      // Respond to client immediately
      return res.status(200).json({ 
        message: "User already exists but was not verified. A new verification code has been sent.", 
        email: existingUser.email // Important for client to redirect
      });
    }


    const defaultPlanName = plansConfig.DEFAULT_PLAN;
    const defaultPlan = plansConfig.PLANS[defaultPlanName];
    
    if (!defaultPlan) {
        console.error(`Default plan '${defaultPlanName}' not found in plans.js.`);
        return res.status(500).json({ message: "Server configuration error during signup. Default plan not found." });
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
    sendVerificationEmail(newUser.email, newUser.verificationCode)
      .catch(err => console.error("Failed to send verification email (background process):", err));

    // Respond to client immediately
    res.status(201).json({ 
        message: "User registered successfully. Please check your email to verify your account.",
        email: newUser.email // Important for client to redirect
    });

  } catch (error) {
    console.error("Signup error:", error);
    // Check for Mongoose duplicate key error (code 11000)
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ message: "Email already in use (database constraint)." });
    }
    // Handle email sending failure specifically if needed
    if (error.message === 'Failed to send verification email.') {
        // Potentially, you might want to still create the user but inform them about the email issue
        // Or, rollback user creation if email is critical for the first step.
        // For now, we'll send a generic server error but log the specific one.
        console.error("Critical: Failed to send verification email during signup.");
    }
    res.status(500).json({ message: "Server error during signup." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // If user signed up with Google, they might not have a password
    if (!user.password && user.googleId) { // Check for googleId as well
        return res.status(401).json({ message: "Please log in with Google, as this account was created via Google Sign-In." });
    }
    
    // If user has a password (meaning email/password signup) but is not verified
    if (user.password && !user.isVerified) {
        return res.status(403).json({ message: "Please verify your email before logging in.", needsVerification: true, email: user.email });
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
            subscription_type: user.subscription_type
        }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified.' });
    }

    if (user.verificationCode !== code.toUpperCase()) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    if (new Date() > user.verificationCodeExpires) {
      return res.status(400).json({ message: 'Verification code expired.' });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    // Log user in automatically
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Email verified successfully. You are now logged in.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        credits: user.credits,
        subscription_type: user.subscription_type,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error during email verification.' });
  }
});

// POST /api/auth/resend-code
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified.' });
    }

    // Optional: Add a cooldown period for resending (e.g., 60 seconds)
    // This would require storing the last code sent time or similar.
    // For simplicity, this example doesn't include a strict cooldown beyond code expiry.

    user.verificationCode = generateVerificationCode();
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendVerificationEmail(user.email, user.verificationCode);

    res.json({ message: 'New verification code sent. Please check your email.' });

  } catch (error) {
    console.error('Resend code error:', error);
    if (error.message === 'Failed to send verification email.') {
        console.error("Critical: Failed to resend verification email.");
    }
    res.status(500).json({ message: 'Server error during resend code.' });
  }
});


router.get("/logout", (req, res) => {
  // For JWT, logout is typically handled client-side by deleting the token.
  // If using passport sessions for other parts (not in this JWT setup), req.logout() would be here.
  // req.logout(); // This might cause an error if session middleware isn't configured for these routes
  res.json({ message: "Logged out (client should clear token)" });
});

// New route to handle access_token-based authentication
// THIS ROUTE (`/google/token`) IS NO LONGER NEEDED FOR THE BACKEND-ONLY FLOW
// You can comment it out or remove it if you are fully switching.
/*
router.post('/google/token', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ message: 'Access token is required' });
  }

  try {
    // Verify access token by calling Google's tokeninfo endpoint
    const googleResponse = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`);
    const tokenInfo = await googleResponse.json();

    if (tokenInfo.error || !tokenInfo.sub) {
      console.error('Invalid Google access token:', tokenInfo.error_description || 'No sub claim');
      return res.status(401).json({ message: 'Invalid Google access token' });
    }

    if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID_WEB) { // Use GOOGLE_CLIENT_ID_WEB for web app client
        console.error('Token audience mismatch:', tokenInfo.aud, 'Expected:', process.env.GOOGLE_CLIENT_ID_WEB);
        return res.status(401).json({ message: 'Token audience mismatch' });
    }

    const googleId = tokenInfo.sub;
    const email = tokenInfo.email;
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profileData = await userInfoResponse.json();

    const name = profileData.name || email;
    const avatar = profileData.picture;

    let user = await User.findOne({ googleId: googleId });

    if (!user) {
      user = await User.create({
        googleId: googleId,
        name: name,
        email: email,
        avatar: avatar,
      });
    }

    const appToken = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token: appToken, user });

  } catch (error) {
    console.error('Error verifying Google token:', error);
    res.status(500).json({ message: 'Internal server error during token verification' });
  }
});
*/

module.exports = router;
