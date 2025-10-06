import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Food from '../models/Food.js';
import ErrorResponse from '../config/ErrorResponse.js';

// @desc    Get or create conversation
// @route   POST /api/messages/conversation
// @access  Private
export const getOrCreateConversation = async (req, res, next) => {
  try {
    const { foodPostId, otherUserId } = req.body;

    if (!foodPostId || !otherUserId) {
      return next(new ErrorResponse('Food post ID and other user ID are required', 400));
    }

    // Verify food post exists
    const foodPost = await Food.findById(foodPostId);
    if (!foodPost) {
      return next(new ErrorResponse('Food post not found', 404));
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, otherUserId] },
      foodPost: foodPostId
    }).populate('participants', 'name email')
      .populate('lastMessage')
      .populate('foodPost', 'title images');

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [req.user.id, otherUserId],
        foodPost: foodPostId,
        unreadCount: {
          [req.user.id]: 0,
          [otherUserId]: 0
        }
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email')
        .populate('foodPost', 'title images');
    }

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'name email')
      .populate('lastMessage')
      .populate('foodPost', 'title images claimStatus')
      .sort('-lastMessageAt');

    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get messages in a conversation
// @route   GET /api/messages/conversation/:conversationId
// @access  Private
export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(new ErrorResponse('Conversation not found', 404));
    }

    if (!conversation.participants.includes(req.user.id)) {
      return next(new ErrorResponse('Not authorized to view this conversation', 403));
    }

    const total = await Message.countDocuments({ conversation: conversationId });

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: req.user.id,
        isRead: false
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    );

    // Reset unread count for current user
    conversation.unreadCount.set(req.user.id.toString(), 0);
    await conversation.save();

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: messages.reverse() // Return in chronological order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, receiverId, content, messageType, attachmentUrl } = req.body;

    if (!conversationId || !receiverId || !content) {
      return next(new ErrorResponse('Conversation ID, receiver ID, and content are required', 400));
    }

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(new ErrorResponse('Conversation not found', 404));
    }

    if (!conversation.participants.includes(req.user.id)) {
      return next(new ErrorResponse('Not authorized to send messages in this conversation', 403));
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      receiver: receiverId,
      foodPost: conversation.foodPost,
      content,
      messageType: messageType || 'text',
      attachmentUrl
    });

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    
    // Increment unread count for receiver
    const receiverUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
    conversation.unreadCount.set(receiverId.toString(), receiverUnread + 1);
    
    await conversation.save();

    // Populate message data
    await message.populate('sender', 'name email');
    await message.populate('receiver', 'name email');

    // Emit socket event for real-time delivery
    const io = req.app.locals.io;
    if (io) {
      io.to(`user_${receiverId}`).emit('newMessage', {
        message,
        conversationId,
        sender: {
          id: req.user.id,
          name: req.user.name
        }
      });
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return next(new ErrorResponse('Message not found', 404));
    }

    if (message.receiver.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to mark this message as read', 403));
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
export const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return next(new ErrorResponse('Message not found', 404));
    }

    if (message.sender.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to delete this message', 403));
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread/count
// @access  Private
export const getUnreadCount = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
      const count = conv.unreadCount.get(req.user.id.toString()) || 0;
      totalUnread += count;
    });

    res.status(200).json({
      success: true,
      data: { unreadCount: totalUnread }
    });
  } catch (err) {
    next(err);
  }
};
