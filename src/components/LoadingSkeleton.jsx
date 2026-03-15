import React from 'react';

const LoadingSkeleton = ({ type = 'card', count = 1 }) => {
  const renderCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
      <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded-md mb-4"></div>
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse space-y-4">
      <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
      <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
      <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
      <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
    </div>
  );

  const renderTextSkeleton = () => (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/6"></div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="h-12 bg-gray-300 dark:bg-gray-700"></div>
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    </div>
  );

  const skeletonMap = {
    card: renderCardSkeleton,
    list: renderListSkeleton,
    form: renderFormSkeleton,
    text: renderTextSkeleton,
    table: renderTableSkeleton,
  };

  const SkeletonComponent = skeletonMap[type] || renderCardSkeleton;

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index} className="mb-4">
          {SkeletonComponent()}
        </div>
      ))}
    </>
  );
};

export default LoadingSkeleton;
