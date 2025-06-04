const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 3001;
const health = require("./routes/health");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const requestRoutes = require("./routes/requests");

const app = express();

app.use(cors());
app.use(express.json());
app.use(
  session({ secret: "your_secret", resave: false, saveUninitialized: true })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use("/api/health", health);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/requests", requestRoutes);

app.listen(port, () => {
  console.log("Server running on port", port);
});
