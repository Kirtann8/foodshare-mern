import React from 'react';

const ErrorMessage = ({ message, onClose }) => {
  return (
    <div className="mb-6">
      <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <p className="flex-1 m-0">{message}</p>
        {onClose && (
          <button className="text-red-600 hover:text-red-800 text-3xl font-bold bg-transparent border-none cursor-pointer leading-none p-0" onClick={onClose}>
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
