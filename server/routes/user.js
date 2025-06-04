const express = require('express');
const authenticateJWT = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

router.get('/me', authenticateJWT, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.sendStatus(404);
  res.json({
    googleId: user.googleId,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    createdAt: user.createdAt
  });
});

module.exports = router;