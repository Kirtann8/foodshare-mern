import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const FoodCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Image Skeleton */}
      <div className="relative h-52 bg-gray-100">
        <Skeleton height="100%" width="100%" />
        
        {/* Category Badge Skeleton */}
        <div className="absolute top-3 left-3">
          <Skeleton width={80} height={28} borderRadius={20} />
        </div>
        
        {/* Status Badge Skeleton */}
        <div className="absolute top-3 right-3">
          <Skeleton width={90} height={28} borderRadius={20} />
        </div>
        
        {/* Location Badge Skeleton */}
        <div className="absolute bottom-3 left-3">
          <Skeleton width={100} height={28} borderRadius={20} />
        </div>
      </div>

      {/* Content Section Skeleton */}
      <div className="p-5">
        {/* Title */}
        <Skeleton height={24} width="80%" className="mb-2" />
        
        {/* Description */}
        <Skeleton count={2} height={16} className="mb-4" />
        
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Skeleton height={20} width="90%" />
          <Skeleton height={20} width="90%" />
        </div>

        {/* Dietary Tags */}
        <div className="flex gap-2 mb-4">
          <Skeleton width={60} height={24} borderRadius={20} />
          <Skeleton width={70} height={24} borderRadius={20} />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div>
            <Skeleton width={40} height={14} className="mb-1" />
            <Skeleton width={60} height={18} />
          </div>
          <Skeleton width={80} height={36} borderRadius={8} />
        </div>
      </div>
    </div>
  );
};

export default FoodCardSkeleton;
