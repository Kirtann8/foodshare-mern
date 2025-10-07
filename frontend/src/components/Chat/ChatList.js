import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageAPI } from '../../services/api';
import AuthContext from '../../context/AuthContext';
import { toast } from 'react-toastify';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 rounded mt-2 animate-pulse"></div>
          </div>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center p-4 border-b border-gray-200 last:border-b-0">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-48 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                <svg className="w-8 h-8 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Messages
              </h1>
              {unreadCount > 0 && (
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <p className="text-sm text-gray-600 font-medium">
                    {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate('/')}
              className="hidden sm:inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Browse Food
            </button>
          </div>
        </div>

        {/* Conversations List */}
        {conversations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
              <svg
                className="h-12 w-12 text-green-600"
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
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start chatting about food donations to see your conversations here. Connect with donors and help reduce food waste!
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-md text-base font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Food Donations
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              const unread = getUnreadCountForConversation(conversation);

              return (
                <div
                  key={conversation._id}
                  onClick={() => navigate(`/messages/${conversation._id}`)}
                  className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all ${
                    unread > 0 ? 'bg-green-50 hover:bg-green-100' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0 relative">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md">
                      {otherParticipant?.name?.charAt(0).toUpperCase()}
                    </div>
                    {unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-xs text-white font-bold">{unread > 9 ? '9+' : unread}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm sm:text-base font-bold text-gray-900 truncate ${unread > 0 ? 'text-green-700' : ''}`}>
                        {otherParticipant?.name}
                      </p>
                      {conversation.lastMessage && (
                        <p className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatLastMessageTime(conversation.updatedAt)}
                        </p>
                      )}
                    </div>
                    {conversation.foodPost && (
                      <div className="flex items-center text-xs text-green-600 font-semibold truncate mb-1">
                        <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="truncate">Re: {conversation.foodPost.title}</span>
                      </div>
                    )}
                    {conversation.lastMessage && (
                      <p className={`text-sm truncate ${
                        unread > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'
                      }`}>
                        {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="ml-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
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
