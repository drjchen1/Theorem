
import React, { useState, useRef, useEffect } from 'react';
import { X, Crop, Sun, Contrast, Pencil, Save, RotateCcw, Download, Sparkles, Loader2, LineChart, Plus, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { recreateFigure, generateGraph } from '../services/geminiService';

interface FigureToEdit {
  id: string;
  src: string;
  originalSrc: string;
  alt: string;
  pageIndex: number;
}

interface ImageEditorProps {
  figures: FigureToEdit[];
  onSave: (updates: { figureId: string, pageIndex: number, newSrc: string }[]) => void;
  onClose: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ figures, onSave, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentFigure = figures[currentIndex];
  
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [color, setColor] = useState('#4f46e5');
  const [mode, setMode] = useState<'view' | 'crop' | 'draw' | 'graph'>('view');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRecreating, setIsRecreating] = useState(false);
  const [isGeneratingGraph, setIsGeneratingGraph] = useState(false);
  const [equations, setEquations] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cropRect, setCropRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // Store edited versions of each figure
  const [editedSrcs, setEditedSrcs] = useState<Record<string, string>>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      ctx.drawImage(img, 0, 0);
    };
    img.src = editedSrcs[currentFigure.id] || currentFigure.src;
  }, [currentIndex, editedSrcs]);

  const applyFilters = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      ctx.drawImage(img, 0, 0);
    };
    img.src = editedSrcs[currentFigure.id] || currentFigure.src;
  };

  useEffect(() => {
    if (mode === 'view') {
      applyFilters();
    }
  }, [brightness, contrast, mode]);

  const handleMagicRecreate = async (all = false) => {
    setIsRecreating(true);
    try {
      const targets = all ? figures : [currentFigure];
      const updates: Record<string, string> = { ...editedSrcs };
      
      for (const fig of targets) {
        const srcToUse = updates[fig.id] || fig.src;
        const newSrc = await recreateFigure(srcToUse, fig.alt);
        updates[fig.id] = newSrc;
        
        if (!all) {
          // Update canvas if single
          const canvas = canvasRef.current;
          if (canvas) {
            const img = new Image();
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.filter = 'none';
                ctx.drawImage(img, 0, 0);
                setBrightness(100);
                setContrast(100);
              }
            };
            img.src = newSrc;
          }
        }
      }
      setEditedSrcs(updates);
    } catch (error) {
      console.error('Magic recreate failed:', error);
      alert('Failed to recreate figure(s). Please try again.');
    } finally {
      setIsRecreating(false);
    }
  };

  const handleGenerateGraph = async () => {
    if (!equations.trim()) {
      alert('Please enter at least one equation.');
      return;
    }
    setIsGeneratingGraph(true);
    try {
      const newSrc = await generateGraph(equations);
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.filter = 'none';
          ctx.drawImage(img, 0, 0);
          setBrightness(100);
          setContrast(100);
          setMode('view');
        }
      };
      img.src = newSrc;
      setEditedSrcs(prev => ({ ...prev, [currentFigure.id]: newSrc }));
    } catch (error) {
      console.error('Graph generation failed:', error);
      alert('Failed to generate graph. Please try again.');
    } finally {
      setIsGeneratingGraph(false);
    }
  };

  const switchToSource = (newSource: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.filter = 'none';
        ctx.drawImage(img, 0, 0);
        setBrightness(100);
        setContrast(100);
      }
    };
    img.src = newSource;
    setEditedSrcs(prev => ({ ...prev, [currentFigure.id]: newSource }));
  };

  const applyFiltersToAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a temporary canvas to apply filters to each image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const updates: Record<string, string> = { ...editedSrcs };
    
    const processAll = async () => {
      for (const fig of figures) {
        const img = new Image();
        const srcToUse = updates[fig.id] || fig.src;
        
        await new Promise((resolve) => {
          img.onload = () => {
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            tempCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
            tempCtx.drawImage(img, 0, 0);
            updates[fig.id] = tempCanvas.toDataURL('image/png');
            resolve(null);
          };
          img.src = srcToUse;
        });
      }
      setEditedSrcs(updates);
      alert('Filters applied to all selected figures.');
    };
    
    processAll();
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== 'draw') return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          // Save current state to editedSrcs
          setEditedSrcs(prev => ({ ...prev, [currentFigure.id]: canvas.toDataURL('image/png') }));
        }
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.filter = 'none'; // Don't apply filters to the drawing itself during active draw

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleCropStart = (e: React.MouseEvent) => {
    if (mode !== 'crop') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsCropping(true);
    setCropRect({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      w: 0,
      h: 0
    });
  };

  const handleCropMove = (e: React.MouseEvent) => {
    if (!isCropping || !cropRect) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCropRect({
      ...cropRect,
      w: (e.clientX - rect.left) - cropRect.x,
      h: (e.clientY - rect.top) - cropRect.y
    });
  };

  const handleCropEnd = () => {
    setIsCropping(false);
  };

  const executeCrop = () => {
    if (!cropRect || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const sx = cropRect.x * scaleX;
    const sy = cropRect.y * scaleY;
    const sw = cropRect.w * scaleX;
    const sh = cropRect.h * scaleY;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.abs(sw);
    tempCanvas.height = Math.abs(sh);
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, Math.abs(sw), Math.abs(sh));
    
    const newSrc = tempCanvas.toDataURL('image/png');
    setEditedSrcs(prev => ({ ...prev, [currentFigure.id]: newSrc }));
    setMode('view');
    setCropRect(null);
  };

  const handleSave = () => {
    const finalUpdates = figures.map(fig => ({
      figureId: fig.id,
      pageIndex: fig.pageIndex,
      newSrc: editedSrcs[fig.id] || fig.src
    }));
    onSave(finalUpdates);
    onClose();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `edited-figure-${currentFigure.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 lg:p-12"
    >
      <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 text-white p-2 rounded-xl">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {figures.length > 1 ? `Batch Figure Editor (${figures.length} Selected)` : 'Figure Editor'}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {figures.length > 1 ? 'Applying changes to multiple figures' : 'Touch up your diagrams'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Sidebar Controls */}
          <div className="w-full lg:w-72 bg-slate-50 border-r border-slate-100 p-8 space-y-8 overflow-y-auto">
            {figures.length > 1 && (
              <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Batch Navigation</h3>
                <div className="flex items-center justify-between gap-2">
                  <button 
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-600">
                    {currentIndex + 1} / {figures.length}
                  </span>
                  <button 
                    onClick={() => setCurrentIndex(prev => Math.min(figures.length - 1, prev + 1))}
                    disabled={currentIndex === figures.length - 1}
                    className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-4 flex gap-1 overflow-x-auto pb-2">
                  {figures.map((fig, idx) => (
                    <button 
                      key={fig.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`flex-shrink-0 w-10 h-10 rounded-lg border-2 transition-all overflow-hidden ${currentIndex === idx ? 'border-indigo-600 scale-110' : 'border-transparent opacity-50'}`}
                    >
                      <img src={editedSrcs[fig.id] || fig.src} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Source Selection</h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => switchToSource(currentFigure.originalSrc)}
                  className="p-2 bg-white border border-slate-200 rounded-xl flex flex-col items-center gap-2 hover:border-indigo-300 transition-all group"
                >
                  <div className="w-full aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
                    <img src={currentFigure.originalSrc} alt="Original" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600">Handwritten</span>
                </button>
                <button 
                  onClick={() => switchToSource(currentFigure.src)}
                  className="p-2 bg-white border border-slate-200 rounded-xl flex flex-col items-center gap-2 hover:border-indigo-300 transition-all group"
                >
                  <div className="w-full aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
                    <img src={currentFigure.src} alt="AI Generated" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600">AI Digitized</span>
                </button>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">AI Enhancement</h3>
              <button 
                onClick={() => handleMagicRecreate(false)}
                disabled={isRecreating}
                className="w-full py-4 bg-gradient-to-br from-indigo-600 to-violet-700 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-violet-800 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isRecreating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                )}
                {isRecreating ? 'Recreating...' : 'Magic Recreate'}
              </button>
              {figures.length > 1 && (
                <button 
                  onClick={() => handleMagicRecreate(true)}
                  disabled={isRecreating}
                  className="w-full py-3 bg-white border border-indigo-200 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Recreate All Selected
                </button>
              )}
              <p className="mt-2 text-[9px] text-slate-400 text-center font-medium">Uses AI to redraw as a clean digital diagram</p>
            </section>

            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tools</h3>
              <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={() => setMode('view')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${mode === 'view' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'}`}
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="text-[9px] font-bold">Reset</span>
                </button>
                <button 
                  onClick={() => setMode('crop')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${mode === 'crop' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'}`}
                >
                  <Crop className="w-5 h-5" />
                  <span className="text-[9px] font-bold">Crop</span>
                </button>
                <button 
                  onClick={() => setMode('draw')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${mode === 'draw' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'}`}
                >
                  <Pencil className="w-5 h-5" />
                  <span className="text-[9px] font-bold">Draw</span>
                </button>
                <button 
                  onClick={() => setMode('graph')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${mode === 'graph' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'}`}
                >
                  <LineChart className="w-5 h-5" />
                  <span className="text-[9px] font-bold">Graph</span>
                </button>
              </div>
            </section>

            {mode === 'graph' && (
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Plot Equations</h3>
                <div className="space-y-3">
                  <textarea
                    value={equations}
                    onChange={(e) => setEquations(e.target.value)}
                    placeholder="e.g., y = x^2, y = sin(x)"
                    className="w-full h-32 p-4 bg-white border border-slate-200 rounded-2xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  />
                  <button
                    onClick={handleGenerateGraph}
                    disabled={isGeneratingGraph}
                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGeneratingGraph ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Generate Plot
                  </button>
                </div>
              </section>
            )}

            {mode === 'draw' && (
              <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Colors</h3>
                <div className="grid grid-cols-4 gap-2">
                  {['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#000000', '#ffffff', '#ec4899', '#8b5cf6'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-full aspect-square rounded-lg border-2 transition-all ${color === c ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Adjustments</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-2">
                      <Sun className="w-3 h-3" /> Brightness
                    </label>
                    <span className="text-[11px] font-black text-indigo-600">{brightness}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="200" value={brightness} 
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-2">
                      <Contrast className="w-3 h-3" /> Contrast
                    </label>
                    <span className="text-[11px] font-black text-indigo-600">{contrast}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="200" value={contrast} 
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
                {figures.length > 1 && (
                  <button 
                    onClick={applyFiltersToAll}
                    className="w-full py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Apply Filters to All
                  </button>
                )}
              </div>
            </section>

            <div className="pt-8 border-t border-slate-200 space-y-3">
              <button 
                onClick={handleSave}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save All Changes
              </button>
              <button 
                onClick={handleDownload}
                className="w-full py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Current PNG
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-slate-200 p-12 flex items-center justify-center overflow-hidden relative" ref={containerRef}>
            <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white">
              <canvas 
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className={`max-w-full max-h-full object-contain ${mode === 'draw' ? 'cursor-crosshair' : mode === 'crop' ? 'cursor-nwse-resize' : 'cursor-default'}`}
              />
              
              {mode === 'crop' && (
                <div 
                  className="absolute inset-0 bg-slate-900/40"
                  onMouseDown={handleCropStart}
                  onMouseMove={handleCropMove}
                  onMouseUp={handleCropEnd}
                >
                  {cropRect && (
                    <div 
                      className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                      style={{
                        left: cropRect.x,
                        top: cropRect.y,
                        width: cropRect.w,
                        height: cropRect.h
                      }}
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); executeCrop(); }}
                        className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white text-slate-900 text-[10px] font-black rounded-full shadow-xl whitespace-nowrap"
                      >
                        Confirm Crop
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {mode === 'draw' && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold rounded-full border border-white/10">
                Drawing Mode Active • Use mouse/touch to annotate
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ImageEditor;
