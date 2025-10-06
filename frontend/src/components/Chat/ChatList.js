import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageAPI } from '../../services/api';
import AuthContext from '../../context/AuthContext';
import { toast } from 'react-toastify';
import Loading from '../Common/Loading';

const ChatList = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await messageAPI.getConversations();
      // Normalize response shapes: endpoint may return { data: [...] } or [...] directly
      const res = response?.data || response || [];
      const convs = Array.isArray(res) ? res : (res.conversations || res.data || []);
      setConversations(Array.isArray(convs) ? convs : []);
      setLoading(false);
    } catch (error) {
      toast.error(error.message || 'Failed to load conversations');
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await messageAPI.getUnreadCount();
      const res = response?.data ?? response ?? {};
      const total = res.totalUnread ?? res.unreadCount ?? res.data?.unreadCount ?? res.unread ?? 0;
      setUnreadCount(total || 0);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const formatLastMessageTime = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation || !Array.isArray(conversation.participants)) return null;
    return conversation.participants.find(p => (p?._id || p) !== user._id) || null;
  };

  const getUnreadCountForConversation = (conversation) => {
    // unreadCount may be an object or a Map depending on backend; handle both
    if (!conversation) return 0;
    const uc = conversation.unreadCount;
    if (!uc) return 0;
    if (typeof uc.get === 'function') return uc.get(user._id) || 0;
    return uc[user._id] || 0;
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Conversations List */}
        {conversations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start chatting about food donations to see your conversations here.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Browse Food Donations
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              const unread = getUnreadCountForConversation(conversation);

              return (
                <div
                  key={conversation._id}
                  onClick={() => navigate(`/messages/${conversation._id}`)}
                  className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0 ${
                    unread > 0 ? 'bg-green-50' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-lg">
                      {otherParticipant?.name?.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {otherParticipant?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {conversation.lastMessage && formatLastMessageTime(conversation.updatedAt)}
                      </p>
                    </div>
                    {conversation.foodPost && (
                      <p className="text-xs text-green-600 truncate mt-0.5">
                        Re: {conversation.foodPost.title}
                      </p>
                    )}
                    {conversation.lastMessage && (
                      <p className={`text-sm truncate mt-1 ${
                        unread > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'
                      }`}>
                        {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>

                  {/* Unread Badge */}
                  {unread > 0 && (
                    <div className="ml-2 flex-shrink-0">
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-green-600 rounded-full">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
