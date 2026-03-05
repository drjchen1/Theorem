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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Accessibility Audit</h2>
            <p className="text-slate-500 text-sm font-medium">Page {result.pageNumber} Compliance Report</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-2xl text-xl font-black ${
              result.audit.score >= 90 ? 'bg-emerald-100 text-emerald-700' :
              result.audit.score >= 70 ? 'bg-amber-100 text-amber-700' :
              'bg-rose-100 text-rose-700'
            }`}>
              {result.audit.score}%
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {result.audit.checks.map((check, idx) => (
            <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
              <div className={`mt-1 p-1 rounded-full ${check.passed ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
                {check.passed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{check.title}</h4>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{check.description}</p>
                {check.suggestion && (
                  <div className="mt-2 p-2 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100 uppercase tracking-wider">
                    Suggestion: {check.suggestion}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800">CLOSE REPORT</button>
        </div>
      </motion.div>
    </div>
  );
};

export default AccessibilityReport;
