import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messageAPI } from '../../services/api';
import AuthContext from '../../context/AuthContext';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const ChatWindow = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    loadMessages();
    
    // Connect to socket
    socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      withCredentials: true,
      auth: {
        token: localStorage.getItem('token')
      }
    });

    // Join conversation room
    socketRef.current.emit('joinConversation', conversationId);

    // Listen for new messages
    socketRef.current.on('newMessage', (message) => {
      if (message.conversation === conversationId) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    });

    // Listen for typing indicators
    socketRef.current.on('userTyping', (data) => {
      if (data.conversationId === conversationId && data.userId !== user._id) {
        setIsTyping(true);
      }
    });

    socketRef.current.on('userStoppedTyping', (data) => {
      if (data.conversationId === conversationId && data.userId !== user._id) {
        setIsTyping(false);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveConversation', conversationId);
        socketRef.current.disconnect();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user._id]);

  const loadMessages = async () => {
    try {
      const response = await messageAPI.getMessages(conversationId);
      // Normalize different possible API response shapes and fall back to safe defaults
      // Possible shapes: axios response where response.data = { success, data: [...] } or response.data = [...] directly
      const res = response?.data ?? response ?? {};
      let messagesArr = [];
      let conv = null;

      if (Array.isArray(res)) {
        messagesArr = res;
      } else if (Array.isArray(res.data)) {
        // e.g., { success:true, data: [messages] }
        messagesArr = res.data;
      } else if (Array.isArray(res.data?.data)) {
        // nested structure
        messagesArr = res.data.data;
      } else if (Array.isArray(res.messages)) {
        messagesArr = res.messages;
      } else if (Array.isArray(res.data?.messages)) {
        messagesArr = res.data.messages;
      }

      // conversation may be provided in different shapes
      conv = res.conversation || res.data?.conversation || res.data?.conv || null;

      setMessages(Array.isArray(messagesArr) ? messagesArr : []);
      // If conversation details were not returned with messages, try to fetch from conversations list
      if (conv) {
        setConversation(conv);
      } else {
        try {
          const convsRes = await messageAPI.getConversations();
          const convs = convsRes?.data ?? convsRes ?? [];
          const convList = Array.isArray(convs) ? convs : (convs.data || convs.conversations || []);
          const found = (convList || []).find(c => c._id === conversationId);
          setConversation(found || null);
        } catch (err) {
          // ignore - conversation remains null
          setConversation(null);
        }
      }
      setLoading(false);
      scrollToBottom();
    } catch (error) {
      toast.error(error.message || 'Failed to load messages');
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = () => {
    if (socketRef.current) {
      socketRef.current.emit('typing', conversationId);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('stopTyping', conversationId);
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // Determine receiverId: prefer conversation participants, otherwise infer from messages
      let receiverId = null;
      if (conversation && Array.isArray(conversation.participants)) {
        const other = conversation.participants.find(p => (p?._id || p) !== user._id);
        receiverId = other?._id || other || null;
      }

      if (!receiverId && messages && messages.length > 0) {
        // Infer from last message
        const last = messages[messages.length - 1];
        const lastSenderId = last?.sender?._id || last?.sender || null;
        const lastReceiverId = last?.receiver?._id || last?.receiver || null;
        receiverId = lastSenderId === user._id ? lastReceiverId : lastSenderId;
      }

      if (!receiverId) {
        toast.error('Cannot determine recipient for this message. Please refresh and try again.');
        return;
      }

      const messageData = {
        conversationId,
        receiverId,
        content: newMessage,
        messageType: 'text'
      };

      const res = await messageAPI.sendMessage(messageData);

      // Normalize return shape and extract message
      const sent = res?.data ?? res ?? null;
      // If response includes wrapper { success:true, data: message }
      const sentMsg = sent?.data ?? sent;

      // Optimistically append sent message to UI
      if (sentMsg) {
        setMessages(prev => [...prev, sentMsg]);
        scrollToBottom();
      }

      setNewMessage('');

      // Stop typing indicator
      if (socketRef.current) {
        socketRef.current.emit('stopTyping', conversationId);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    }
  };

  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday ' + messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
             messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const otherParticipant = conversation?.participants.find(p => p._id !== user._id);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center shadow-sm">
        <button
          onClick={() => navigate('/messages')}
          className="mr-4 text-gray-600 hover:text-gray-800"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center flex-1">
          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
            {otherParticipant?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <h2 className="text-lg font-semibold text-gray-800">{otherParticipant?.name}</h2>
            {conversation?.foodPost && (
              <p className="text-sm text-gray-500">
                Re: {conversation.foodPost.title}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {(messages || []).map((message) => {
          // message.sender might be populated as a user object or a simple id string depending on backend
          const senderId = message?.sender?._id || message?.sender || null;
          const isOwnMessage = senderId === user?._id;
          return (
            <div
              key={message._id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="text-sm break-words">{message.content}</p>
                </div>
                <p
                  className={`text-xs text-gray-500 mt-1 ${
                    isOwnMessage ? 'text-right' : 'text-left'
                  }`}
                >
                  {formatMessageTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-2xl px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-green-600 text-white rounded-full p-3 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
