
import React, { useState } from 'react';
import { LanguageLevel } from '../types';

interface DashboardProps {
  onFileUpload: (file: File, languageLevel: LanguageLevel) => void;
  isProcessing: boolean;
  onShowDocs: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onFileUpload, isProcessing, onShowDocs }) => {
  const [languageLevel, setLanguageLevel] = useState<LanguageLevel>('faithful');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file, languageLevel);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isProcessing) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileUpload(file, languageLevel);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4">
      {/* 1. Top: Q.E.D. Title and Chenflix badge */}
      <div className="flex items-center gap-4 md:gap-6 mb-12">
        <div className="bg-slate-900 text-purdue w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-xl md:rounded-2xl shadow-xl shadow-slate-200 flex-shrink-0">
          <span className="text-3xl md:text-4xl font-serif italic font-bold leading-none select-none transform -translate-y-1">Q</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">
            Q.E.D. <span className="font-bold text-slate-500">&nbsp; (Quod Erat <span className="italic font-black text-purdue pr-1">Digitandum</span>)</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">As Seen on</span>
            <a 
              href="https://drjchen1.github.io/chenflix/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] md:text-[12px] font-black text-[#E50914] tracking-tighter transform scale-y-110 inline-block drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)] hover:opacity-80 transition-opacity"
            >
              CHENFLIX
            </a>
          </div>
        </div>
      </div>

      {/* 3. The Card */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full max-w-lg text-center p-8 md:p-12 border-2 border-dashed rounded-[2rem] md:rounded-[2.5rem] bg-white transition-all duration-300 ${
          isDragging 
            ? 'border-purdue bg-purdue/5 scale-[1.02] shadow-2xl shadow-purdue/10' 
            : 'border-slate-200'
        }`}
      >
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-8 whitespace-normal md:whitespace-nowrap">
          Ready to <span className="text-purdue" style={{ fontFamily: "'Pixelify Sans', sans-serif", fontWeight: 700, fontSize: '1.05em', verticalAlign: 'baseline', display: 'inline-block', transform: 'translateY(0.02em)' }}>Digitize.</span>
        </h2>
        
        <div className="mb-8 flex flex-col items-center">
          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-full border border-slate-200 shadow-inner">
            {(['faithful', 'natural', 'fleshed_out'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setLanguageLevel(level)}
                className={`px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                  languageLevel === level 
                    ? 'bg-purdue text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                {level === 'faithful' ? 'Faithful' : level === 'natural' ? 'Natural' : 'Detailed'}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {languageLevel === 'faithful' ? 'Exact Transcription' : languageLevel === 'natural' ? 'Natural Sentences' : 'Detailed Explanations'}
          </p>
        </div>

        <div>
          <label className="inline-flex items-center justify-center w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 bg-purdue hover:brightness-95 text-black font-bold rounded-xl md:rounded-2xl shadow-xl transition-all cursor-pointer">
            <span className="text-sm md:text-base">Upload File</span>
            <input type="file" className="sr-only" accept="application/pdf,image/*,.heic,.heif,.txt" onChange={handleFileChange} disabled={isProcessing} />
          </label>
        </div>
      </div>

      {/* 5. Bottom Links */}
      <div className="mt-12 flex items-center justify-center gap-6 md:gap-10 text-[11px] md:text-sm font-black text-slate-400 uppercase tracking-widest">
        <button onClick={onShowDocs} className="hover:text-purdue transition-colors">How to Use</button>
        <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank" rel="noopener noreferrer" className="hover:text-purdue transition-colors">WCAG 2.2 AA</a>
        <span className="select-none opacity-50">v1.0.0</span>
      </div>
    </div>
  );
};

export default Dashboard;
