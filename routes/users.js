const _ = require("lodash");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { User, validate } = require("../models/user");
const auth = require("../middleware/auth");
const {
  resetPassword,
  handleResetPassword,
  setPassword,
} = require("../controllers/passwordReset");

// Get User
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select(["-password", "-__v"]);
  res.send(user);
});

// Register User
router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let username = await User.findOne({ username: req.body.username });
  if (username) return res.status(400).send("Username is already taken.");

  let email = await User.findOne({ email: req.body.email });
  if (email)
    return res.status(400).send("User has already registered with this email");

  const user = new User(_.pick(req.body, ["username", "email", "password"]));
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();

  const token = user.generateAuthToken();
  res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .send(_.pick(user, ["_id", "email", "username"]));
});

// Login
router.post("/login", async (req, res) => {
  let user = await User.findOne({ username: req.body.username });

  if (!user) user = await User.findOne({ email: req.body.username });

  if (!user) return res.status(400).send("Invalid username or password.");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res.status(400).send("Invalid username or password.");

  const token = user.generateAuthToken();
  res.send(token);
});

// Reset Password
router.post("/resetPassword", resetPassword);

// Handle Password Reset
router.get("/auth/reset/:userId/:otpCode", handleResetPassword);

// Set New Password
router.post("/setNewPassword", setPassword);

module.exports = router;
