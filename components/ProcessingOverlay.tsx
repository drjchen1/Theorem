
import React from 'react';

interface ProcessingOverlayProps {
  progress: number;
  status: string;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ progress, status }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="relative inline-flex">
             <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-indigo-600">
                {Math.round(progress)}%
             </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Processing Your Notes</h2>
        <p className="text-slate-600 mb-6 font-medium animate-pulse">{status}</p>
        
        <div className="w-full bg-slate-200 rounded-full h-2.5 mb-4">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-slate-500 italic">
          We're using AI to recognize handwriting and render complex math with pixel-perfect accuracy. This may take a moment depending on the number of pages.
        </p>
      </div>
    </div>
  );
};

export default ProcessingOverlay;
