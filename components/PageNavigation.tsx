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
    <div className="flex border-b border-slate-200 bg-white px-4 overflow-x-auto no-scrollbar">
      {results.map((res, idx) => (
        <button
          key={idx}
          onClick={() => onTabChange(idx)}
          className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
            activeTab === idx 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Page {res.pageNumber}
        </button>
      ))}
    </div>
  );
};

export default PageNavigation;
