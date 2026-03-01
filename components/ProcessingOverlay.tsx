
import React from 'react';

interface ProcessingOverlayProps {
  progress: number;
  status: string;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ progress, status }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-md w-full border border-slate-100">
        <div className="mb-10">
          <div className="relative inline-flex">
             <div className="w-24 h-24 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center text-lg font-black text-slate-900 tracking-tighter">
                {Math.round(progress)}%
             </div>
          </div>
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Digitizing Notes</h2>
        <p className="text-slate-500 mb-8 font-medium animate-pulse text-sm uppercase tracking-widest">{status}</p>
        
        <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
          <div 
            className="bg-indigo-600 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(79,70,229,0.4)]" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="text-xs text-slate-400 leading-relaxed font-medium">
          Our AI is currently transcribing handwriting and rendering complex mathematics with pixel-perfect accuracy. This may take a moment depending on the complexity of your notes.
        </p>
      </div>
    </div>
  );
};

export default ProcessingOverlay;
