import React from 'react';
import { ConversionResult } from '../types';

interface SidebarProps {
  activeTab: number;
  results: ConversionResult[];
  isRefining: boolean;
  onFontSizeChange: (newSize: number) => void;
  onRefineMath: () => void;
  onBatchEdit: () => void;
  onDownloadHtml: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  results,
  isRefining,
  onFontSizeChange,
  onRefineMath,
  onBatchEdit,
  onDownloadHtml
}) => {
  const currentResult = results[activeTab];
  if (!currentResult) return null;

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-slate-900 mb-4 text-[10px] uppercase tracking-widest border-t border-slate-100 pt-4">Controls</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Font Size</label>
            <span className="text-[10px] font-black text-indigo-600">{currentResult.fontSize || 18}px</span>
          </div>
          <input 
            type="range" 
            min="12" 
            max="32" 
            value={currentResult.fontSize || 18} 
            onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
        <button 
          onClick={onRefineMath} 
          disabled={isRefining}
          className="w-full py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-bold hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isRefining ? 'REFINING...' : 'REFINE MATH (AI)'}
        </button>
        <button 
          onClick={onBatchEdit} 
          className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold hover:bg-slate-800"
        >
          BATCH EDIT FIGURES
        </button>
        <button 
          onClick={onDownloadHtml} 
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold hover:bg-indigo-700"
        >
          DOWNLOAD HTML
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
