import express from 'express';
import {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  getUnreadCount
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/conversation', getOrCreateConversation);
router.get('/conversations', getConversations);
router.get('/conversation/:conversationId', getMessages);
router.post('/', sendMessage);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteMessage);
router.get('/unread/count', getUnreadCount);

export default router;
