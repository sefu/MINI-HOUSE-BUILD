
import React from 'react';

export const LoadingSpinner: React.FC = () => {
    return (
        <div role="status" className="flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 border-8 border-dashed rounded-full animate-spin border-yellow-500"></div>
            <p className="text-sky-700 font-semibold">Working our magic...</p>
        </div>
    );
};
