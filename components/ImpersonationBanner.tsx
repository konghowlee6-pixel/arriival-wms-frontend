import React from 'react';

interface ImpersonationBannerProps {
    clientName: string;
    onReturn: () => void;
}

const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({ clientName, onReturn }) => {
    return (
        <div className="bg-yellow-400 text-yellow-900 p-3 text-center text-sm font-semibold flex justify-between items-center w-full z-50">
            <span className="flex-grow">
                You are currently viewing as <span className="font-bold">{clientName}</span>.
            </span>
            <button 
                onClick={onReturn} 
                className="ml-4 py-1 px-3 bg-yellow-600 text-white text-xs font-bold rounded-md hover:bg-yellow-700 transition-colors"
            >
                Return to Admin Dashboard
            </button>
        </div>
    );
};

export default ImpersonationBanner;
