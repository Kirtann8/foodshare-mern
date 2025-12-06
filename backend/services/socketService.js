/**
 * Socket.io service for real-time notifications
 */

// Notification types
export const NOTIFICATION_TYPES = {
  FOOD_CLAIMED: 'food_claimed',
  FOOD_APPROVED: 'food_approved',
  FOOD_REJECTED: 'food_rejected',
  VOLUNTEER_ASSIGNED: 'volunteer_assigned',
  ASSIGNMENT_ACCEPTED: 'assignment_accepted',
  COLLECTION_STATUS_UPDATED: 'collection_status_updated',
  NEW_MESSAGE: 'new_message'
};

// @desc    Emit notification to specific user
export const emitToUser = (io, userId, event, data) => {
  if (!io || !userId) return;
  
  io.to(`user_${userId}`).emit(event, {
    ...data,
    timestamp: new Date(),
    id: Date.now() + Math.random()
  });
  
  console.log(`Socket notification sent to user ${userId}:`, event);
};

// @desc    Emit notification to all users
export const emitToAll = (io, event, data) => {
  if (!io) return;
  
  io.emit(event, {
    ...data,
    timestamp: new Date(),
    id: Date.now() + Math.random()
  });
  
  console.log(`Socket notification sent to all users:`, event);
};

// @desc    Emit notification to specific role
export const emitToRole = (io, role, event, data) => {
  if (!io || !role) return;
  
  io.to(`role_${role}`).emit(event, {
    ...data,
    timestamp: new Date(),
    id: Date.now() + Math.random()
  });
  
  console.log(`Socket notification sent to role ${role}:`, event);
};

// @desc    Send food approval notification
export const notifyFoodApproval = (io, food, approver, status) => {
  const notificationData = {
    type: status === 'approved' ? NOTIFICATION_TYPES.FOOD_APPROVED : NOTIFICATION_TYPES.FOOD_REJECTED,
    foodId: food._id,
    foodTitle: food.title,
    status,
    approver: {
      id: approver._id,
      name: approver.name
    },
    message: status === 'approved' 
      ? `Your food donation "${food.title}" has been approved!`
      : `Your food donation "${food.title}" needs attention.`
  };

  // Notify the donor
  emitToUser(io, food.donor._id || food.donor, 'notification', notificationData);
  
  // Notify all admins and volunteers about the approval activity
  emitToRole(io, 'admin', 'food_approval_activity', notificationData);
  emitToRole(io, 'volunteer', 'food_approval_activity', notificationData);
};

// @desc    Send volunteer assignment notification
export const notifyVolunteerAssignment = (io, assignment, food, volunteer) => {
  const notificationData = {
    type: NOTIFICATION_TYPES.VOLUNTEER_ASSIGNED,
    assignmentId: assignment._id,
    foodId: food._id,
    foodTitle: food.title,
    volunteer: {
      id: volunteer._id,
      name: volunteer.name
    },
    message: `You have been assigned to collect "${food.title}"`
  };

  // Notify the assigned volunteer
  emitToUser(io, volunteer._id, 'notification', notificationData);
  
  // Notify the donor about volunteer assignment
  const donorNotification = {
    type: NOTIFICATION_TYPES.VOLUNTEER_ASSIGNED,
    foodId: food._id,
    foodTitle: food.title,
    volunteer: {
      id: volunteer._id,
      name: volunteer.name
    },
    message: `A volunteer has been assigned to collect your donation "${food.title}"`
  };
  
  emitToUser(io, food.donor._id || food.donor, 'notification', donorNotification);
};

// @desc    Send food claim notification
export const notifyFoodClaim = (io, food, claimer) => {
  const notificationData = {
    type: NOTIFICATION_TYPES.FOOD_CLAIMED,
    foodId: food._id,
    foodTitle: food.title,
    claimer: {
      id: claimer._id,
      name: claimer.name,
      email: claimer.email
    },
    message: `Your food donation "${food.title}" has been claimed by ${claimer.name}`
  };

  // Notify the donor
  emitToUser(io, food.donor._id || food.donor, 'notification', notificationData);
  
  // Broadcast to all users (for real-time updates on food list)
  emitToAll(io, 'food_claimed', {
    foodId: food._id,
    claimedBy: claimer.name
  });
};

// @desc    Send assignment acceptance notification
export const notifyAssignmentAcceptance = (io, assignment, food, volunteer) => {
  const notificationData = {
    type: NOTIFICATION_TYPES.ASSIGNMENT_ACCEPTED,
    assignmentId: assignment._id,
    foodId: food._id,
    foodTitle: food.title,
    volunteer: {
      id: volunteer._id,
      name: volunteer.name
    },
    message: `${volunteer.name} has accepted the assignment for "${food.title}"`
  };

  // Notify admins about assignment acceptance
  emitToRole(io, 'admin', 'notification', notificationData);
  
  // Notify the donor
  const donorNotification = {
    ...notificationData,
    message: `The volunteer ${volunteer.name} has accepted to collect your donation "${food.title}"`
  };
  
  emitToUser(io, food.donor._id || food.donor, 'notification', donorNotification);
};

// @desc    Send collection status update notification
export const notifyCollectionStatusUpdate = (io, food, volunteer, status, distributionDetails = null) => {
  const statusMessages = {
    collected: 'has collected',
    distributed: 'has distributed',
    completed: 'has completed the delivery of'
  };

  const message = `${volunteer.name} ${statusMessages[status] || 'updated'} your donation "${food.title}"`;
  
  const notificationData = {
    type: NOTIFICATION_TYPES.COLLECTION_STATUS_UPDATED,
    foodId: food._id,
    foodTitle: food.title,
    status,
    volunteer: {
      id: volunteer._id,
      name: volunteer.name
    },
    distributionDetails,
    message
  };

  // Notify the donor
  emitToUser(io, food.donor._id || food.donor, 'notification', notificationData);
  
  // Notify admins
  emitToRole(io, 'admin', 'collection_update', notificationData);
};