const Joi = require("joi");
const bcrypt = require("bcrypt");
const sendMail = require("../middleware/mailer");
const { User } = require("../models/user");
const randomstring = require("randomstring");
const { emailTemplate } = require("./emailTemplate");

// Reset Password
const resetPassword = async (req, res, next) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const otp = randomstring.generate();

  let user = await User.findOneAndUpdate(
    { email: req.body.email },
    {
      $set: {
        otp,
      },
      returnNewDocument: true,
    }
  );

  if (!user) return res.status(422).send("Email does not have an account");

  const encodedUserId = encodeURIComponent(
    Buffer.from(`${user._id}`, "binary").toString("base64")
  );
  const encodedOtpCode = encodeURIComponent(
    Buffer.from(`${otp}`, "binary").toString("base64")
  );

  sendMail(
    "TODOLIST <todolist@noreply.com>",
    "Request to reset password",
    `${user.email}`,
    emailTemplate(
      user.username,
      process.env.BASE_URL,
      encodedUserId,
      encodedOtpCode
    ),
    err => {
      if (err) return res.status(500).send("Internal Server Error");
      res.send(
        "Password reset requested! Please, check your mail and reset your password!"
      );
    }
  );
};

// Handle Password Reset
const handleResetPassword = async (req, res) => {
  const decodedUserId = decodeURIComponent(req.params.userId);
  const decodedOtpCode = decodeURIComponent(req.params.otpCode);

  const userId = Buffer.from(decodedUserId, "base64").toString();
  const otpCode = Buffer.from(decodedOtpCode, "base64").toString();

  let user = await User.findById(userId);

  if (!user) return res.status(404).send("No user found!");

  if (user.otp == otpCode) {
    return res
      .status(200)
      .json({ userId: userId, status: "Verified", otp: otpCode });
  } else {
    return res.status(401).send("Error resetting password!");
  }
};

// Set New Password from Reset
const setPassword = async (req, res) => {
  let { userId, newPassword, otp } = req.body;

  let user = await User.findById(userId);

  if (!user) return res.status(404).send("User does not exist");

  if (user.otp === otp) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = null;

    await user.save();

    res.send("Password reset successful");
  } else {
    res.status(404).send("Password reset failed create new link!");
  }
};

function validate(email) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
  });

  return schema.validate(email);
}

module.exports = { resetPassword, handleResetPassword, setPassword };
