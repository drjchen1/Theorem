import React from 'react';
import { ConversionResult } from '../types';

interface DocumentViewerProps {
  viewMode: 'preview' | 'source' | 'latex';
  activeTab: number;
  results: ConversionResult[];
  contentRef: React.RefObject<HTMLDivElement>;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  viewMode,
  activeTab,
  results,
  contentRef
}) => {
  const currentResult = results[activeTab];
  if (!currentResult) return null;

  return (
    <div className="flex-1 overflow-y-auto">
      {viewMode === 'preview' ? (
        <article 
          ref={contentRef} 
          className={`math-content prose prose-slate prose-indigo transition-all duration-700 mx-auto ${currentResult.orientation === 'landscape' ? 'max-w-5xl' : 'max-w-3xl'}`}
          style={{ fontSize: `${currentResult.fontSize || 18}px` }}
        >
          <div 
            className="bg-white p-16 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100"
            dangerouslySetInnerHTML={{ __html: currentResult.html || '' }} 
          />
        </article>
      ) : viewMode === 'source' ? (
        <div className="max-w-4xl mx-auto bg-slate-900 text-slate-300 p-10 rounded-[2.5rem] border border-white/10 shadow-2xl font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
          <div className="flex items-center gap-2 mb-6 text-slate-500 uppercase tracking-widest text-[9px] font-black">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            HTML Source
          </div>
          {currentResult.html}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto bg-slate-900 text-slate-300 p-10 rounded-[2.5rem] border border-white/10 shadow-2xl font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
          <div className="flex items-center gap-2 mb-6 text-slate-500 uppercase tracking-widest text-[9px] font-black">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            LaTeX Equations
          </div>
          {currentResult.latex}
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
