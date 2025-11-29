import express from 'express';
import {
  getFoodPostContacts,
  sendFoodPostNotification,
  getVolunteerServiceAreas,
  schedulePickupCoordination,
  reportDistributionCompletion
} from '../controllers/communicationController.js';

const router = express.Router();

import { protect, authorize, authorizeVolunteerOrAdmin } from '../middleware/auth.js';

// Get contact details for food post participants
router.get('/contacts/:foodId', protect, getFoodPostContacts);

// Send notifications to food post participants
router.post('/notify/:foodId', protect, authorizeVolunteerOrAdmin, sendFoodPostNotification);

// Get volunteer service area statistics (Admin only)
router.get('/volunteer/service-areas', protect, authorize('admin'), getVolunteerServiceAreas);

// Schedule pickup coordination (Volunteer only)
router.post('/schedule-pickup/:foodId', protect, authorizeVolunteerOrAdmin, schedulePickupCoordination);

// Report distribution completion (Volunteer only)
router.post('/report-distribution/:foodId', protect, authorizeVolunteerOrAdmin, reportDistributionCompletion);

export default router;