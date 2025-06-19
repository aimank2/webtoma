const express = require("express");
const passport = require("../passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // Added bcrypt
const User = require("../models/User");
const plansConfig = require('../config/plans'); // Renamed for clarity, or use plans.PLANS directly
const router = express.Router();

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

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use." });
    }

    // REMOVE THIS LINE: const hashedPassword = await bcrypt.hash(password, 10);

    const defaultPlanName = plansConfig.DEFAULT_PLAN;
    const defaultPlan = plansConfig.PLANS[defaultPlanName];
    
    if (!defaultPlan) {
        console.error(`Default plan '${defaultPlanName}' not found in plans.js.`);
        return res.status(500).json({ message: "Server configuration error during signup. Default plan not found." });
    }

    const newUser = new User({
      name,
      email: normalizedEmail,
      password: password, // Pass the PLAIN password here
      subscription_type: defaultPlanName,
      credits: defaultPlan.monthly_credit_limit,
      monthly_credit_limit: defaultPlan.monthly_credit_limit,
      credits_used_this_month: 0,
      last_reset: new Date(),
    });

    await newUser.save(); // The pre('save') hook in User.js will now hash the plain password

    const token = jwt.sign(
      { id: newUser._id, name: newUser.name, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({ 
        token,
        user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            avatar: newUser.avatar, // Will be undefined initially for email signup
            credits: newUser.credits,
            subscription_type: newUser.subscription_type
        }
    });

  } catch (error) {
    console.error("Signup error:", error);
    // Check for Mongoose duplicate key error (code 11000)
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ message: "Email already in use (database constraint)." });
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
    if (!user.password) {
        return res.status(401).json({ message: "Please log in with Google, as this account was created via Google Sign-In." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
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
