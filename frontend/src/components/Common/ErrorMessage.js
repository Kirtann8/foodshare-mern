import React from 'react';
import './Common.css';

const ErrorMessage = ({ message, onClose }) => {
  return (
    <div className="error-message-container">
      <div className="error-message-content">
        <span className="error-icon">⚠️</span>
        <p>{message}</p>
        {onClose && (
          <button className="error-close" onClick={onClose}>
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
