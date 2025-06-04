const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true }, // Unique but not required, sparse allows nulls not to conflict
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: { type: String }, // Not required if using Google OAuth
  name: String,
  avatar: String,
  createdAt: { type: Date, default: Date.now },
});

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // User might have signed up with OAuth
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
