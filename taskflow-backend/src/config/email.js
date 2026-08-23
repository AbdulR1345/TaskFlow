const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // For development - using Gmail (you can change later)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,      // Your Gmail
      pass: process.env.EMAIL_PASSWORD   // App Password (not normal password)
    }
  });

  const mailOptions = {
    from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;