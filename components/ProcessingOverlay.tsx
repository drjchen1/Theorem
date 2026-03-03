
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, FileText, Sparkles, Binary, FunctionSquare, Sigma } from 'lucide-react';

interface ProcessingOverlayProps {
  progress: number;
  status: string;
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

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ progress, status }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-2xl z-50 flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-[4rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] p-16 max-w-xl w-full border border-slate-100 relative overflow-hidden"
      >
        <FloatingMath />
        
        {/* Animated background pulse */}
        <motion.div 
          animate={{ 
            opacity: [0.02, 0.05, 0.02],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-indigo-600 pointer-events-none"
        />

        <div className="relative z-10">
          <div className="mb-12">
            <div className="relative inline-flex">
              {/* Outer spinning ring with gradient */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-40 h-40 border-[8px] border-slate-50 border-t-indigo-600 border-r-indigo-400 rounded-full shadow-inner"
              />
              
              {/* Pulsing glow */}
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-4 bg-indigo-500/10 rounded-full blur-2xl"
              />

              {/* Inner progress circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.div 
                    key={Math.round(progress)}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-baseline justify-center"
                  >
                    <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
                      {Math.round(progress)}
                    </span>
                    <span className="text-xl font-black text-indigo-600 ml-0.5">%</span>
                  </motion.div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 block">Digitizing</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Q.E.D. Engine <span className="text-indigo-600">Active</span></h2>
            <div className="h-6 overflow-hidden flex justify-center">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={status}
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -15, opacity: 0 }}
                  className="text-slate-500 font-bold text-[11px] uppercase tracking-widest"
                >
                  {status}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          
          <div className="relative mb-12">
            <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden p-1.5 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="bg-indigo-600 h-full rounded-full shadow-[0_0_25px_rgba(79,70,229,0.6)] relative overflow-hidden"
              >
                {/* Shimmering light effect */}
                <motion.div 
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full skew-x-12"
                />
              </motion.div>
            </div>
            
            {/* Scanning line effect */}
            <motion.div 
              animate={{ left: ['0%', '100%', '0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-2 -bottom-2 w-0.5 bg-indigo-400/50 shadow-[0_0_15px_rgba(79,70,229,0.8)] z-20"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Scanning', icon: Scan, threshold: 10 },
              { label: 'Transcribing', icon: Binary, threshold: 40 },
              { label: 'Refining', icon: Sparkles, threshold: 80 }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <motion.div 
                  animate={progress >= step.threshold ? { 
                    scale: [1, 1.2, 1],
                    backgroundColor: ['#f1f5f9', '#4f46e5', '#4f46e5'],
                    color: ['#94a3b8', '#ffffff', '#ffffff']
                  } : {}}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-500 ${progress >= step.threshold ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-300'}`}
                >
                  <step.icon size={20} strokeWidth={2.5} />
                </motion.div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${progress >= step.threshold ? 'text-slate-900' : 'text-slate-300'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
            <div className="flex items-center justify-center gap-3 text-slate-400">
              <FunctionSquare size={14} className="animate-pulse" />
              <p className="text-[10px] font-medium leading-relaxed max-w-[280px]">
                AI is processing semantic structures and LaTeX alignment for maximum accessibility.
              </p>
              <Sigma size={14} className="animate-pulse" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProcessingOverlay;
