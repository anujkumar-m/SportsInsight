const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendPasswordResetEmail = async (email, firstName, resetToken, resetUrl) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Sports Academy'}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Password Reset Request — Sports Academy System',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; background: #F8FAFC; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #0F172A 0%, #2563EB 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🏅 Sports Academy</h1>
            <p style="color: #93C5FD; margin: 8px 0 0 0;">Performance Intelligence System</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1F2937; margin-bottom: 16px;">Password Reset Request</h2>
            <p style="color: #6B7280; line-height: 1.6;">Hello <strong>${firstName}</strong>,</p>
            <p style="color: #6B7280; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #2563EB, #10B981); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">Reset Password</a>
            </div>
            <p style="color: #9CA3AF; font-size: 14px;">This link expires in 1 hour. If you did not request a password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
            <p style="color: #9CA3AF; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Sports Academy System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendWelcomeEmail = async (email, firstName, role) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Sports Academy'}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Welcome to Sports Academy System',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #F8FAFC; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #0F172A 0%, #2563EB 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0;">🏅 Sports Academy</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1F2937;">Welcome, ${firstName}!</h2>
            <p style="color: #6B7280;">Your account has been created with the role: <strong>${role}</strong></p>
            <p style="color: #6B7280;">You can now log in to the Sports Academy Performance Intelligence System.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail, sendWelcomeEmail };
