import nodemailer from 'nodemailer';

/**
 * Email service utility for sending verification and password reset emails
 */

// Create transporter
const createTransporter = () => {
  // Check if email configuration exists
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Email configuration is required. Please set EMAIL_USER and EMAIL_PASSWORD in .env file');
  }

  // Use Gmail SMTP or any other email service
  // For production, use services like SendGrid, AWS SES, etc.
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD // For Gmail, use an App Password
    }
  });
  
  return transporter;
};

/**
 * Send email verification OTP
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.name - Recipient name
 * @param {string} options.token - Verification token/OTP
 */
export const sendVerificationEmail = async ({ email, name, token }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'FoodShare'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Email Verification - FoodShare',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .otp { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; text-align: center; padding: 20px; background-color: #fff; border: 2px dashed #4CAF50; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to FoodShare!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for registering with FoodShare. To complete your registration, please verify your email address using the OTP below:</p>
              
              <div class="otp">${token}</div>
              
              <p>This OTP will expire in <strong>15 minutes</strong>.</p>
              
              <p>If you didn't create an account with FoodShare, please ignore this email.</p>
              
              <p>Best regards,<br>The FoodShare Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} FoodShare. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hello ${name},\n\nThank you for registering with FoodShare. Your verification OTP is: ${token}\n\nThis OTP will expire in 15 minutes.\n\nIf you didn't create an account with FoodShare, please ignore this email.\n\nBest regards,\nThe FoodShare Team`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send password reset OTP
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.name - Recipient name
 * @param {string} options.token - Reset token/OTP
 */
export const sendPasswordResetEmail = async ({ email, name, token }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'FoodShare'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - FoodShare',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #FF5722; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .otp { font-size: 32px; font-weight: bold; color: #FF5722; letter-spacing: 5px; text-align: center; padding: 20px; background-color: #fff; border: 2px dashed #FF5722; border-radius: 5px; margin: 20px 0; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>We received a request to reset your password for your FoodShare account. Use the OTP below to reset your password:</p>
              
              <div class="otp">${token}</div>
              
              <p>This OTP will expire in <strong>15 minutes</strong>.</p>
              
              <div class="warning">
                <strong>⚠️ Security Note:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure.
              </div>
              
              <p>Best regards,<br>The FoodShare Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} FoodShare. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hello ${name},\n\nWe received a request to reset your password. Your password reset OTP is: ${token}\n\nThis OTP will expire in 15 minutes.\n\nIf you didn't request a password reset, please ignore this email.\n\nBest regards,\nThe FoodShare Team`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send welcome email after successful verification
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.name - Recipient name
 */
export const sendWelcomeEmail = async ({ email, name }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'FoodShare'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to FoodShare - Let\'s Fight Food Waste Together!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .features { background-color: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .feature { margin: 15px 0; padding-left: 30px; position: relative; }
            .feature:before { content: "✓"; position: absolute; left: 0; color: #4CAF50; font-weight: bold; font-size: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to FoodShare!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Congratulations! Your email has been verified successfully. You're now part of a community working together to reduce food waste and help those in need.</p>
              
              <div class="features">
                <h3>What you can do on FoodShare:</h3>
                <div class="feature">Donate surplus food from your home or business</div>
                <div class="feature">Find and claim food donations in your area</div>
                <div class="feature">Connect with donors and recipients</div>
                <div class="feature">Track your donations and claims</div>
                <div class="feature">Make a positive impact on your community</div>
              </div>
              
              <p>Start making a difference today by sharing food or finding food in your area!</p>
              
              <p>Thank you for joining our mission to reduce food waste. 🌱</p>
              
              <p>Best regards,<br>The FoodShare Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} FoodShare. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hello ${name},\n\nWelcome to FoodShare! Your email has been verified successfully.\n\nYou can now:\n- Donate surplus food\n- Find and claim food donations\n- Connect with your community\n- Make a positive impact\n\nThank you for joining our mission!\n\nBest regards,\nThe FoodShare Team`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email - it's not critical
    return { success: false, error: error.message };
  }
};

/**
 * Send password change OTP (for authenticated users)
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.name - Recipient name
 * @param {string} options.token - Change password token/OTP
 */
export const sendPasswordChangeEmail = async ({ email, name, token }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'FoodShare'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Change Verification - FoodShare',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .otp { font-size: 32px; font-weight: bold; color: #2196F3; letter-spacing: 5px; text-align: center; padding: 20px; background-color: #fff; border: 2px dashed #2196F3; border-radius: 5px; margin: 20px 0; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Change Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>We received a request to change your password. To verify this request, please use the OTP below:</p>
              
              <div class="otp">${token}</div>
              
              <p>This OTP will expire in <strong>15 minutes</strong>.</p>
              
              <div class="warning">
                <strong>⚠️ Security Alert:</strong> If you didn't request this password change, please contact us immediately and change your password.
              </div>
              
              <p>Best regards,<br>The FoodShare Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} FoodShare. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hello ${name},\n\nWe received a request to change your password. Your password change OTP is: ${token}\n\nThis OTP will expire in 15 minutes.\n\nIf you didn't request this password change, please contact us immediately.\n\nBest regards,\nThe FoodShare Team`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password change email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password change email:', error);
    throw new Error('Failed to send password change email');
  }
};
