import React from 'react';
import { motion } from 'framer-motion';
import { ConversionResult } from '../types';

interface AccessibilityReportProps {
  result: ConversionResult | null;
  onClose: () => void;
}

const AccessibilityReport: React.FC<AccessibilityReportProps> = ({
  result,
  onClose
}) => {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-200"
      >
        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Audit Report</h2>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mt-1">Page {result.pageNumber} Compliance Analysis</p>
          </div>
          <div className="flex items-center gap-6">
            <div className={`font-mono text-3xl font-black ${
              result.audit.score >= 90 ? 'text-emerald-600' :
              result.audit.score >= 70 ? 'text-amber-600' :
              'text-rose-600'
            }`}>
              {result.audit.score}%
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-slate-200 rounded-2xl transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-10 space-y-4">
          {result.audit.checks.map((check, idx) => (
            <div key={idx} className="flex gap-6 p-6 rounded-[2rem] border border-slate-100 bg-white hover:border-slate-200 transition-colors">
              <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${check.passed ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                {check.passed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                )}
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm tracking-tight">{check.title}</h4>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed font-medium">{check.description}</p>
                {check.suggestion && (
                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <p className="text-indigo-600 font-black uppercase text-[9px] tracking-widest mb-1">Recommendation</p>
                    <p className="text-slate-600 text-xs font-medium">{check.suggestion}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">Close Audit</button>
        </div>
      </motion.div>
    </div>
  );
};

export default AccessibilityReport;
