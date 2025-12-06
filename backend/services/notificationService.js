import { sendEmail } from '../utils/emailService.js';

/**
 * Notification service for sending various types of notifications
 */

// @desc    Send food approval notification
export const sendFoodApprovalNotification = async ({ email, name, foodTitle, status, reason = null }) => {
  const subject = status === 'approved' 
    ? 'Food Donation Approved - FoodShare'
    : 'Food Donation Update - FoodShare';

  const html = status === 'approved' 
    ? `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .success { background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Food Donation Approved!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <div class="success">
              <strong>Great news!</strong> Your food donation "${foodTitle}" has been approved and is now visible to the community.
            </div>
            <p>Your generous donation can now help those in need. Thank you for making a difference!</p>
            <p>Best regards,<br>The FoodShare Team</p>
          </div>
        </div>
      </body>
      </html>
    `
    : `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF5722; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Food Donation Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <div class="warning">
              Your food donation "${foodTitle}" requires attention.
              ${reason ? `<br><strong>Reason:</strong> ${reason}` : ''}
            </div>
            <p>Please review and update your donation if needed.</p>
            <p>Best regards,<br>The FoodShare Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

  return await sendEmail({ to: email, subject, html });
};

// @desc    Send volunteer assignment notification
export const sendVolunteerAssignmentNotification = async ({ email, name, foodTitle, donorName, pickupAddress }) => {
  const subject = 'New Food Collection Assignment - FoodShare';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .assignment { background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚚 New Collection Assignment</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <div class="assignment">
            <strong>You have been assigned to collect:</strong><br>
            <strong>Food:</strong> ${foodTitle}<br>
            <strong>Donor:</strong> ${donorName}<br>
            <strong>Pickup Location:</strong> ${pickupAddress}
          </div>
          <p>Please log in to your volunteer dashboard to accept this assignment and coordinate with the donor.</p>
          <p>Thank you for your service to the community!</p>
          <p>Best regards,<br>The FoodShare Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};

// @desc    Send food claim notification to donor
export const sendFoodClaimNotification = async ({ email, name, foodTitle, claimerName, claimerEmail }) => {
  const subject = 'Your Food Donation Has Been Claimed - FoodShare';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .claim { background-color: #e8f5e8; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Food Donation Claimed!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <div class="claim">
            <strong>Great news!</strong> Your food donation "${foodTitle}" has been claimed.<br>
            <strong>Claimed by:</strong> ${claimerName}<br>
            <strong>Contact:</strong> ${claimerEmail}
          </div>
          <p>Please coordinate with the claimer for pickup arrangements. Thank you for your generosity!</p>
          <p>Best regards,<br>The FoodShare Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};

// @desc    Send food completion notification
export const sendFoodCompletionNotification = async ({ email, name, foodTitle, donorName }) => {
  const subject = 'Food Donation Completed - FoodShare';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .completion { background-color: #e8f5e8; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Food Donation Completed!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <div class="completion">
            <strong>Good news!</strong> The food donation "${foodTitle}" from ${donorName} has been marked as completed.
          </div>
          <p>Thank you for helping make this food rescue successful!</p>
          <p>Best regards,<br>The FoodShare Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};

// @desc    Send collection status update notification
export const sendCollectionStatusNotification = async ({ email, name, foodTitle, status, distributionDetails = null }) => {
  const subject = `Food Collection Update: ${status.replace('_', ' ').toUpperCase()} - FoodShare`;
  
  const statusMessages = {
    collected: 'has been collected by our volunteer',
    distributed: 'has been successfully distributed to those in need'
  };
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .status { background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Collection Status Update</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <div class="status">
            <strong>Update:</strong> Your food donation "${foodTitle}" ${statusMessages[status] || 'has been updated'}.
            ${distributionDetails ? `<br><strong>Distribution Details:</strong> ${distributionDetails}` : ''}
          </div>
          <p>Thank you for your generous contribution to helping those in need!</p>
          <p>Best regards,<br>The FoodShare Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};