const nodemailer = require("nodemailer");
const { google } = require("googleapis");
require("dotenv").config();

const { OAuth2 } = google.auth;
const OAUTH_PLAYGROUND = "https://developers.google.com/oauthplayground";

const {
  MAILING_SERVICE_CLIENT_ID,
  MAILING_SERVICE_CLIENT_SECRET,
  MAILING_SERVICE_REFRESH_TOKEN,
  MAILING_SERVICE_USERNAME,
} = process.env;

const oauth2Client = new OAuth2(
  MAILING_SERVICE_CLIENT_ID,
  MAILING_SERVICE_CLIENT_SECRET,
  OAUTH_PLAYGROUND
);

oauth2Client.setCredentials({ refresh_token: MAILING_SERVICE_REFRESH_TOKEN });

const accessToken = oauth2Client.getAccessToken();

const smtpTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: MAILING_SERVICE_USERNAME,
    clientId: MAILING_SERVICE_CLIENT_ID,
    clientSecret: MAILING_SERVICE_CLIENT_SECRET,
    refreshToken: MAILING_SERVICE_REFRESH_TOKEN,
    accessToken,
  },
});

const sendEmail = (from, subject, bcc, html, cb) => {
  const mailOptions = {
    from,
    bcc,
    subject,
    html,
  };

  smtpTransport.sendMail(mailOptions, (err, info) => {
    if (err) cb(err, null);
    else cb(null, info);
  });
};

module.exports = sendEmail;
