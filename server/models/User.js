const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  googleId: { type: String, sparse: true }, // Unique constraint removed, sparse kept
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

  // New fields for credit system
  credits: { type: Number, default: 20 }, // Default credits for new users (e.g., free plan)
  subscription_type: {
    type: String,
    enum: ["free", "trial", "starter", "pro", "elite"],
    default: "free",
  },
  monthly_credit_limit: { type: Number, default: 20 }, // Corresponds to the free plan
  credits_used_this_month: { type: Number, default: 0 },
  last_reset: { type: Date, default: Date.now },

  // Optional payment integration fields
  // payment_customer_id: { type: String, sparse: true },
  // billing_history: [{
  //   plan: String,
  //   amount: Number,
  //   date: Date,
  //   invoice_url: String
  // }],
});

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
