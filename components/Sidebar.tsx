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
    <div className="space-y-8">
      <div>
        <h3 className="font-black text-slate-900 mb-6 text-[11px] uppercase tracking-widest">Controls</h3>
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Font Size</label>
              <span className="font-mono text-[11px] font-black text-indigo-600">{currentResult.fontSize || 18}px</span>
            </div>
            <input 
              type="range" 
              min="12" 
              max="32" 
              value={currentResult.fontSize || 18} 
              onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-2 pt-4">
            <button 
              onClick={onRefineMath} 
              disabled={isRefining}
              className="w-full py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isRefining ? (
                <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              )}
              {isRefining ? 'Refining...' : 'Refine Math'}
            </button>
            
            <button 
              onClick={onBatchEdit} 
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Edit Figures
            </button>
            
            <button 
              onClick={onDownloadHtml} 
              className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download HTML
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
