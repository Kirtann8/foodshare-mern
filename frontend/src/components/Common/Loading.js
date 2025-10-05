import React from 'react';

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600 font-medium">Loading...</p>
    </div>
  );
};

export default Loading;
