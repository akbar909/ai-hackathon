import React from 'react';

const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="spinner w-16 h-16 mx-auto mb-4"></div>
                <p className="text-gray-400 text-lg">Loading...</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
