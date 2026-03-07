
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, FileText, Sparkles, Binary, FunctionSquare, Sigma } from 'lucide-react';

interface ProcessingOverlayProps {
  progress: number;
  status: string;
  elapsedTime?: number;
  sessionRequestCount?: number;
  dailyRequestCount?: number;
}

const FloatingMath = () => {
  const symbols = ['∑', '∫', 'π', '∞', '√', 'Δ', 'Ω', 'θ', 'λ', 'μ'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
      {symbols.map((symbol, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + '%', 
            y: Math.random() * 100 + '%',
            rotate: Math.random() * 360,
            scale: 0.5 + Math.random()
          }}
          animate={{ 
            y: [null, '-10%', '110%'],
            rotate: [null, 360],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 10 + Math.random() * 20, 
            repeat: Infinity, 
            delay: Math.random() * 10,
            ease: "linear"
          }}
          className="absolute text-indigo-900 font-serif text-2xl"
        >
          {symbol}
        </motion.div>
      ))}
    </div>
  );
};

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ progress, status, elapsedTime, sessionRequestCount, dailyRequestCount }) => {
  const rpm = elapsedTime && sessionRequestCount ? Math.round((sessionRequestCount / (elapsedTime / 60)) * 10) / 10 : 0;
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Immersive background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 bg-white/80 backdrop-blur-3xl rounded-[4rem] p-16 max-w-xl w-full border border-slate-200 shadow-2xl"
      >
        <FloatingMath />
        
        <div className="relative z-10">
          <div className="mb-12 flex justify-center">
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="w-48 h-48 border border-slate-200 rounded-full flex items-center justify-center"
              >
                <div className="w-40 h-40 border border-slate-200 rounded-full border-dashed" />
              </motion.div>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div 
                  key={Math.round(progress)}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-baseline"
                >
                  <span className="text-6xl font-black text-slate-900 tracking-tighter">
                    {Math.round(progress)}
                  </span>
                  <span className="text-xl font-black text-indigo-600 ml-1">%</span>
                </motion.div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Processing</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Q.E.D. Engine <span className="text-indigo-600 italic serif">Active</span></h2>
            <div className="h-6 overflow-hidden flex justify-center">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={status}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  className="text-slate-500 font-bold text-[11px] uppercase tracking-widest"
                >
                  {status}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-8 mb-12">
            {[
              { label: 'Scan', icon: Scan, threshold: 10 },
              { label: 'Parse', icon: Binary, threshold: 40 },
              { label: 'Refine', icon: Sparkles, threshold: 80 }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border ${progress >= step.threshold ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_30px_rgba(79,70,229,0.2)]' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  <step.icon size={24} strokeWidth={2.5} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${progress >= step.threshold ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-center gap-6 text-slate-400 font-mono text-[10px] font-bold">
            {elapsedTime !== undefined && <span>{elapsedTime}s elapsed</span>}
            {rpm > 0 && <span>{rpm} RPM</span>}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProcessingOverlay;
