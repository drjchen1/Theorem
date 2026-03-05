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
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-8 lg:p-12">
      {viewMode === 'preview' ? (
        <article 
          ref={contentRef} 
          className={`math-content prose prose-slate prose-indigo transition-all duration-500 ${currentResult.orientation === 'landscape' ? 'max-w-6xl' : 'max-w-4xl'}`}
          style={{ fontSize: `${currentResult.fontSize || 18}px` }}
        >
          <div dangerouslySetInnerHTML={{ __html: currentResult.html || '' }} />
        </article>
      ) : viewMode === 'source' ? (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm font-mono text-xs overflow-x-auto whitespace-pre-wrap">
          {currentResult.html}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm font-mono text-xs overflow-x-auto whitespace-pre-wrap">
          {currentResult.latex}
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
