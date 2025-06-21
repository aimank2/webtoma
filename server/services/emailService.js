const nodemailer = require('nodemailer');

// Configure the transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // e.g., 'smtp.example.com'
  port: process.env.EMAIL_PORT || 587, // 587 for TLS, 465 for SSL
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // your email address
    pass: process.env.EMAIL_PASS, // your email password or app-specific password
  },
});

const sendVerificationEmail = async (toEmail, verificationCode) => {
  const mailOptions = {
    from: `"Your App Name" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Verify Your Email Address',
    html: `
      <p>Welcome!</p>
      <p>Please verify your account using the code: <strong>${verificationCode}</strong></p>
      <p>This code will expire in 10 minutes.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${toEmail}`);
  } catch (error) {
    console.error(`Error sending verification email to ${toEmail}:`, error);
    // Depending on your error handling strategy, you might want to throw the error
    // or handle it gracefully (e.g., log and allow signup to proceed, user can resend)
    throw new Error('Failed to send verification email.'); 
  }
};

module.exports = { sendVerificationEmail };