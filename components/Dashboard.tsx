
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageLevel } from '../types';
import { ChevronDown, Info } from 'lucide-react';

interface DashboardProps {
  onFileUpload: (file: File, languageLevel: LanguageLevel) => void;
  isProcessing: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ onFileUpload, isProcessing }) => {
  const [languageLevel, setLanguageLevel] = useState<LanguageLevel>('faithful');
  const [showTips, setShowTips] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file, languageLevel);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 md:mt-12 text-center p-6 md:p-12 border-2 border-dashed border-slate-200 rounded-[2rem] md:rounded-[3rem]">
      <div className="w-full md:w-fit mx-auto">
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-6 md:mb-8 whitespace-normal md:whitespace-nowrap">
          Ready to <span className="text-indigo-600" style={{ fontFamily: "'Pixelify Sans', sans-serif", fontWeight: 700, fontSize: '1.05em', verticalAlign: 'baseline', display: 'inline-block', transform: 'translateY(0.02em)' }}>Digitize.</span>
        </h2>
        
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-1 p-1 bg-slate-100 rounded-full border border-slate-200 w-full">
            {(['faithful', 'natural', 'fleshed_out'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setLanguageLevel(level)}
                className={`flex-1 px-2 md:px-4 py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${languageLevel === level ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {level === 'faithful' ? 'Faithful' : level === 'natural' ? 'Natural' : 'Fleshed Out'}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {languageLevel === 'faithful' ? 'Exact Transcription' : languageLevel === 'natural' ? 'Natural Sentences' : 'Detailed Explanations'}
          </p>
        </div>

        <div className="mb-8 md:mb-12">
          <label className="inline-flex items-center gap-3 md:gap-4 px-8 md:px-12 py-4 md:py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl md:rounded-2xl shadow-xl transition-all cursor-pointer">
            <span className="text-sm md:text-base">Upload File</span>
            <input type="file" className="sr-only" accept="application/pdf,image/*,.heic,.heif,.txt" onChange={handleFileChange} disabled={isProcessing} />
          </label>
        </div>

        <div className="text-left">
          <button 
            onClick={() => setShowTips(!showTips)}
            className="w-full flex items-center justify-between p-1 bg-slate-100 rounded-full border border-slate-200 hover:bg-slate-200 transition-colors group"
          >
            <div className="flex items-center gap-2 py-1.5 px-3 md:px-4">
              <Info strokeWidth={3} className="text-indigo-500 w-3 h-3 md:w-3.5 md:h-3.5" />
              <h3 className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
                Tips for Success
              </h3>
            </div>
            <motion.div
              animate={{ rotate: showTips ? 180 : 0 }}
              className="pr-3 md:pr-4 text-slate-300 group-hover:text-slate-500 transition-colors"
            >
              <ChevronDown strokeWidth={3} className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showTips && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 pt-4 bg-slate-50/50 rounded-3xl mt-2 border border-slate-100">
                  <ul className="space-y-3">
                    <li className="flex gap-3 items-start">
                      <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        <span className="font-bold text-slate-900">Large Files:</span> Documents over 20 pages work best when split into smaller parts.
                      </p>
                    </li>
                    <li className="flex gap-3 items-start">
                      <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        <span className="font-bold text-slate-900">Image Quality:</span> Clear, high-contrast photos ensure accurate math recognition.
                      </p>
                    </li>
                    <li className="flex gap-3 items-start">
                      <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        <span className="font-bold text-slate-900">Complex Layouts:</span> Use high-res images for pages with dense or overlapping notes.
                      </p>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
