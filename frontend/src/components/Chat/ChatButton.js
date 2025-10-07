import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageAPI } from '../../services/api';
import AuthContext from '../../context/AuthContext';
import { toast } from 'react-toastify';

const ChatButton = ({ foodPostId, donorId }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    if (!user) {
      toast.info('Please login to start chatting');
      navigate('/login');
      return;
    }

    if (user._id === donorId) {
      toast.info('You cannot chat with yourself');
      return;
    }

    setLoading(true);
    try {
      const response = await messageAPI.getOrCreateConversation(foodPostId, donorId);
      navigate(`/messages/${response.data._id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartChat}
      disabled={loading}
      className="group w-full bg-white text-green-600 border-2 border-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-600 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-green-600 flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
      title={user?._id === donorId ? 'You cannot message yourself' : 'Start a conversation with the donor'}
    >
      {loading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connecting...
        </span>
      ) : (
        <span className="flex items-center">
          <svg className="w-5 h-5 mr-2 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Message Donor
          <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      )}
    </button>
  );
};

export default ChatButton;
