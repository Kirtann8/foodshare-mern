import Food from '../models/Food.js';
import User from '../models/User.js';
import VolunteerAssignment from '../models/VolunteerAssignment.js';
import ErrorResponse from '../config/ErrorResponse.js';
import { sendEmail } from '../utils/emailService.js';

// @desc    Get contact details for food post participants
// @route   GET /api/communication/contacts/:foodId
// @access  Private/Volunteer/Admin
export const getFoodPostContacts = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.foodId)
      .populate('donor', 'name email phone address')
      .populate('volunteerAssigned', 'name email phone')
      .populate('claimedBy', 'name email phone');

    if (!food) {
      return next(new ErrorResponse('Food post not found', 404));
    }

    // Check authorization - only involved parties can access contacts
    const isAuthorized = 
      req.user.role === 'admin' ||
      food.donor._id.toString() === req.user.id ||
      food.volunteerAssigned?._id.toString() === req.user.id ||
      food.claimedBy?._id.toString() === req.user.id;

    if (!isAuthorized) {
      return next(new ErrorResponse('Not authorized to access contact details', 403));
    }

    const contacts = {
      donor: food.donor,
      volunteer: food.volunteerAssigned,
      receiver: food.claimedBy
    };

    res.status(200).json({
      success: true,
      data: contacts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send notification to food post participants
// @route   POST /api/communication/notify/:foodId
// @access  Private/Volunteer/Admin
export const sendFoodPostNotification = async (req, res, next) => {
  try {
    const { recipients, subject, message, notificationType } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return next(new ErrorResponse('Recipients are required', 400));
    }

    if (!subject || !message) {
      return next(new ErrorResponse('Subject and message are required', 400));
    }

    const food = await Food.findById(req.params.foodId)
      .populate('donor', 'name email')
      .populate('volunteerAssigned', 'name email')
      .populate('claimedBy', 'name email');

    if (!food) {
      return next(new ErrorResponse('Food post not found', 404));
    }

    // Check authorization
    const isAuthorized = 
      req.user.role === 'admin' ||
      food.volunteerAssigned?._id.toString() === req.user.id;

    if (!isAuthorized) {
      return next(new ErrorResponse('Not authorized to send notifications', 403));
    }

    const emailPromises = [];
    const participantMap = {
      donor: food.donor,
      volunteer: food.volunteerAssigned,
      receiver: food.claimedBy
    };

    recipients.forEach(recipientType => {
      const participant = participantMap[recipientType];
      if (participant && participant.email) {
        emailPromises.push(
          sendEmail({
            to: participant.email,
            subject: `[FoodShare] ${subject}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4F46E5;">Food Post Communication</h2>
                <p><strong>Food Post:</strong> ${food.title}</p>
                <p><strong>From:</strong> ${req.user.name} (${req.user.role})</p>
                <hr style="border: 1px solid #E5E7EB; margin: 20px 0;">
                <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
                <hr style="border: 1px solid #E5E7EB; margin: 20px 0;">
                <p style="color: #6B7280; font-size: 14px;">
                  This is an automated message from the FoodShare platform. 
                  Please do not reply to this email directly.
                </p>
              </div>
            `
          })
        );
      }
    });

    await Promise.all(emailPromises);

    res.status(200).json({
      success: true,
      message: `Notification sent to ${emailPromises.length} recipients`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get volunteer service area statistics
// @route   GET /api/communication/volunteer/service-areas
// @access  Private/Admin
export const getVolunteerServiceAreas = async (req, res, next) => {
  try {
    const serviceAreas = await User.aggregate([
      {
        $match: {
          role: { $in: ['volunteer', 'admin'] },
          isActive: true,
          'volunteerApplication.status': 'approved',
          'volunteerApplication.serviceArea': { $exists: true, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$volunteerApplication.serviceArea',
          volunteerCount: { $sum: 1 },
          volunteers: {
            $push: {
              id: '$_id',
              name: '$name',
              email: '$email'
            }
          }
        }
      },
      {
        $sort: { volunteerCount: -1 }
      }
    ]);

    // Get food post distribution by city
    const foodDistribution = await Food.aggregate([
      {
        $match: {
          isActive: true,
          approvalStatus: 'approved',
          'location.city': { $exists: true, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$location.city',
          foodPostCount: { $sum: 1 },
          availableCount: {
            $sum: { $cond: [{ $eq: ['$claimStatus', 'available'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { foodPostCount: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        serviceAreas,
        foodDistribution
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Schedule pickup coordination
// @route   POST /api/communication/schedule-pickup/:foodId
// @access  Private/Volunteer
export const schedulePickupCoordination = async (req, res, next) => {
  try {
    const { proposedTime, message } = req.body;

    if (!proposedTime) {
      return next(new ErrorResponse('Proposed pickup time is required', 400));
    }

    const food = await Food.findById(req.params.foodId)
      .populate('donor', 'name email phone')
      .populate('volunteerAssigned', 'name email phone');

    if (!food) {
      return next(new ErrorResponse('Food post not found', 404));
    }

    // Check if user is the assigned volunteer
    if (food.volunteerAssigned?._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to schedule pickup for this food post', 403));
    }

    // Send coordination email to donor
    const emailSubject = `Pickup Coordination for "${food.title}"`;
    const emailMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">🚚 Pickup Coordination</h2>
        
        <div style="background-color: #F0F9FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0369A1; margin-top: 0;">Food Post Details</h3>
          <p><strong>Title:</strong> ${food.title}</p>
          <p><strong>Quantity:</strong> ${food.quantity}</p>
          <p><strong>Location:</strong> ${food.location.address}, ${food.location.city}</p>
        </div>

        <div style="background-color: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #166534; margin-top: 0;">Volunteer Information</h3>
          <p><strong>Name:</strong> ${req.user.name}</p>
          <p><strong>Email:</strong> ${req.user.email}</p>
          ${req.user.phone ? `<p><strong>Phone:</strong> ${req.user.phone}</p>` : ''}
        </div>

        <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #92400E; margin-top: 0;">Proposed Pickup Time</h3>
          <p style="font-size: 18px; font-weight: bold;">${new Date(proposedTime).toLocaleString()}</p>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        </div>

        <div style="background-color: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #DC2626; margin-top: 0;">⚠️ Important</h3>
          <p>Please confirm this pickup time by replying to the volunteer directly or through the FoodShare platform.</p>
          <p>If this time doesn't work, please suggest an alternative time within your original pickup window.</p>
        </div>

        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from the FoodShare platform. 
          For immediate assistance, please contact the volunteer directly.
        </p>
      </div>
    `;

    await sendEmail({
      to: food.donor.email,
      subject: emailSubject,
      html: emailMessage
    });

    // Update assignment with coordination details
    await VolunteerAssignment.findOneAndUpdate(
      { foodPost: food._id, volunteer: req.user.id },
      {
        $set: {
          notes: `Pickup scheduled for ${new Date(proposedTime).toLocaleString()}. ${message || ''}`
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Pickup coordination email sent to donor'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Report distribution completion
// @route   POST /api/communication/report-distribution/:foodId
// @access  Private/Volunteer
export const reportDistributionCompletion = async (req, res, next) => {
  try {
    const { recipientCount, distributionLocation, distributionNotes, recipientFeedback } = req.body;

    if (!recipientCount || recipientCount < 1) {
      return next(new ErrorResponse('Recipient count is required and must be at least 1', 400));
    }

    const food = await Food.findById(req.params.foodId)
      .populate('donor', 'name email')
      .populate('volunteerAssigned', 'name email');

    if (!food) {
      return next(new ErrorResponse('Food post not found', 404));
    }

    // Check if user is the assigned volunteer
    if (food.volunteerAssigned?._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to report distribution for this food post', 403));
    }

    // Update assignment with distribution details
    const assignment = await VolunteerAssignment.findOneAndUpdate(
      { foodPost: food._id, volunteer: req.user.id },
      {
        $set: {
          status: 'distributed',
          distributedAt: new Date(),
          distributionDetails: {
            recipientCount,
            distributionLocation,
            distributionNotes
          }
        }
      },
      { new: true }
    );

    // Update food post status
    food.collectionStatus = 'distributed';
    await food.save();

    // Send completion report to donor
    const emailSubject = `Distribution Complete: "${food.title}"`;
    const emailMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">✅ Distribution Completed Successfully!</h2>
        
        <div style="background-color: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #166534; margin-top: 0;">Your Food Donation Impact</h3>
          <p><strong>Food Item:</strong> ${food.title}</p>
          <p><strong>Quantity:</strong> ${food.quantity}</p>
          <p><strong>People Helped:</strong> ${recipientCount} recipients</p>
          ${distributionLocation ? `<p><strong>Distribution Location:</strong> ${distributionLocation}</p>` : ''}
        </div>

        <div style="background-color: #F0F9FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0369A1; margin-top: 0;">Volunteer Report</h3>
          <p><strong>Volunteer:</strong> ${req.user.name}</p>
          <p><strong>Distribution Date:</strong> ${new Date().toLocaleDateString()}</p>
          ${distributionNotes ? `<p><strong>Notes:</strong> ${distributionNotes}</p>` : ''}
        </div>

        ${recipientFeedback ? `
        <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #92400E; margin-top: 0;">💬 Recipient Feedback</h3>
          <p style="font-style: italic;">"${recipientFeedback}"</p>
        </div>
        ` : ''}

        <div style="background-color: #F3E8FF; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="color: #7C3AED; margin-top: 0;">🎉 Thank You for Making a Difference!</h3>
          <p>Your generous donation has successfully reached ${recipientCount} people in need. 
          Together, we're building a stronger, more caring community.</p>
        </div>

        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          This is an automated report from the FoodShare platform. 
          Thank you for your continued support in fighting food waste and hunger.
        </p>
      </div>
    `;

    await sendEmail({
      to: food.donor.email,
      subject: emailSubject,
      html: emailMessage
    });

    res.status(200).json({
      success: true,
      message: 'Distribution report sent successfully',
      data: assignment
    });
  } catch (err) {
    next(err);
  }
};