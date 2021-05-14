const Joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendMail = require("../middleware/mailer");
const { User } = require("../models/user");
const { emailTemplate } = require("./emailTemplate");
require("dotenv").config();

// Reset Password
const resetPassword = async (req, res, next) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });

  if (!user) return res.status(422).send("Email does not have an account");

  const token = jwt.sign({ userId: user._id }, process.env.passwordResetToken, {
    expiresIn: "1h",
  });

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        otp: token,
      },
    }
  );

  sendMail(
    "TODOLIST <todolist@noreply.com>",
    "Request to reset password",
    `${user.email}`,
    emailTemplate(user.username, req.body.clientUrl, token),
    err => {
      if (err) {
        console.log(err);
        return res.status(500).send("Internal Server Error");
      }
      res.send(
        "Password reset requested! Please, check your mail and reset your password!"
      );
    }
  );
};

// Set New Password from Reset
const setPassword = async (req, res) => {
  let { userId, password, otp } = req.body;

  if (!password) return res.status(400).send("Please enter your password");

  let user = await User.findById(userId);

  if (!user) return res.status(404).send("User does not exist");

  if (user.otp === otp) {
    bcrypt.hash(password, 10, async (err, hash) => {
      if (err) return res.status(500).send("Internal Server Error");

      user.password = hash;
      user.otp = null;

      await user.save();

      res.send("Password reset successful");
    });
  } else {
    res.status(404).send("Password reset failed create new link!");
  }
};

function validate(email) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    clientUrl: Joi.string().uri(),
  });

  return schema.validate(email);
}

module.exports = { resetPassword, setPassword };
