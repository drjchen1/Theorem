import React from 'react';
import { ConversionResult } from '../types';

interface PageNavigationProps {
  results: ConversionResult[];
  activeTab: number;
  onTabChange: (index: number) => void;
}

const PageNavigation: React.FC<PageNavigationProps> = ({
  results,
  activeTab,
  onTabChange
}) => {
  return (
    <div className="grid grid-cols-1 gap-1">
      {results.map((res, idx) => (
        <button
          key={idx}
          onClick={() => onTabChange(idx)}
          className={`group flex items-center justify-between px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === idx 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
              : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
          }`}
        >
          <span>Page {res.pageNumber}</span>
          {activeTab === idx ? (
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-slate-300" />
          )}
        </button>
      ))}
    </div>
  );
};

export default PageNavigation;
