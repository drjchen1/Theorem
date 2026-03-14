
import { useState, useEffect, useCallback } from 'react';
import { AppState, ConversionResult, LanguageLevel } from '../types';
import { pdfToImageData } from '../services/pdfService';
import { convertBatchToHtml, refineLatex } from '../services/geminiService';
import { runAccessibilityAudit } from '../utils/accessibility';
import { cropImage } from '../utils/image';
import { cleanAltText } from '../utils/dom';

export const useDigitization = () => {
  const [state, setState] = useState<AppState>({
    isProcessing: false,
    progress: 0,
    results: [],
    error: null,
    statusMessage: 'Waiting for upload...',
    sessionRequestCount: 0,
    dailyRequestCount: 0
  });

  const [elapsedTime, setElapsedTime] = useState(0);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('qed_daily_requests');
    if (stored) {
      const { date, count } = JSON.parse(stored);
      if (date === today) {
        setState(prev => ({ ...prev, dailyRequestCount: count }));
      } else {
        localStorage.setItem('qed_daily_requests', JSON.stringify({ date: today, count: 0 }));
      }
    } else {
      localStorage.setItem('qed_daily_requests', JSON.stringify({ date: today, count: 0 }));
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (state.isProcessing) {
      const startTime = Date.now();
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [state.isProcessing]);

  const incrementRequestCount = useCallback(() => {
    setState(prev => {
      const newDailyCount = prev.dailyRequestCount + 1;
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('qed_daily_requests', JSON.stringify({ date: today, count: newDailyCount }));
      return {
        ...prev,
        sessionRequestCount: prev.sessionRequestCount + 1,
        dailyRequestCount: newDailyCount
      };
    });
  }, []);

  const handleFileUpload = async (file: File, languageLevel: LanguageLevel) => {
    if (!file) return;

    setOriginalFile(file);
    const startTime = Date.now();
    setState(prev => ({
      ...prev,
      isProcessing: true,
      progress: 0,
      results: [],
      error: null,
      statusMessage: 'Reading file...',
      sessionRequestCount: 0
    }));

    try {
      // Use optimize: true for faster processing and lower quota hit
      const pageData = await pdfToImageData(file, true);
      const totalPages = pageData.length;
      
      const BATCH_SIZE = 2; // Micro-batching: 2 pages per request for maximum stability
      const CONCURRENCY_LIMIT = 2; // Process 2 batches at once for speed
      const results: ConversionResult[] = new Array(totalPages);
      let completedPages = 0;

      const processBatch = async (batchIndices: number[]) => {
        try {
          const batchImages = batchIndices.map(idx => ({
            base64: pageData[idx].base64,
            pageNumber: idx + 1
          }));

          setState(prev => ({ 
            ...prev, 
            statusMessage: `Digitizing Pages ${batchIndices.map(i => i + 1).join(', ')} of ${totalPages}...`,
          }));

          incrementRequestCount();
          const batchResponses = await convertBatchToHtml(batchImages, languageLevel);

          for (let k = 0; k < batchIndices.length; k++) {
            const i = batchIndices[k];
            const geminiResponse = batchResponses[k];
            
            if (!geminiResponse) continue;

            let finalHtml = geminiResponse.html;
            
            const figureResults = geminiResponse.figures.map((fig) => {
              const screenshotBase64 = cropImage(pageData[i].canvas, fig);
              return {
                id: fig.id,
                originalSrc: screenshotBase64,
                currentSrc: screenshotBase64,
                alt: fig.alt
              };
            });
            
            figureResults.forEach(figResult => {
              const imgTagRegex = new RegExp(`<img[^>]*id=["']${figResult.id}["'][^>]*>`, 'g');
              const cleanAlt = cleanAltText(figResult.alt);
              const displayAlt = figResult.alt;

              const figureHtml = `
                <figure class="my-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 group/fig" role="group" aria-label="Visual figure: ${cleanAlt}">
                  <div class="relative overflow-hidden rounded-lg shadow-sm border border-slate-200 bg-white flex justify-center">
                    <img src="${figResult.currentSrc}" alt="${cleanAlt}" class="max-w-full h-auto" data-figure-id="${figResult.id}">
                    <button class="edit-figure-btn absolute top-2 right-2 p-2 bg-white/90 backdrop-blur shadow-lg rounded-lg opacity-0 group-hover/fig:opacity-100 transition-all hover:bg-indigo-600 hover:text-white" data-figure-id="${figResult.id}" title="Edit Figure">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                  </div>
                  <figcaption class="mt-4 text-sm text-slate-700 font-sans text-center italic leading-relaxed" aria-hidden="true">
                    Figure: ${displayAlt}
                  </figcaption>
                </figure>
              `;
              finalHtml = finalHtml.replace(imgTagRegex, figureHtml);
            });

            const audit = runAccessibilityAudit(finalHtml);

            results[i] = { 
              html: finalHtml, 
              pageNumber: i + 1,
              width: pageData[i].width,
              height: pageData[i].height,
              audit,
              figures: figureResults
            };

            completedPages++;
            setState(prev => ({
              ...prev,
              progress: (completedPages / totalPages) * 100,
              statusMessage: `Completed ${completedPages} of ${totalPages} pages...`,
              results: results.filter(r => r !== undefined).sort((a, b) => a.pageNumber - b.pageNumber)
            }));
          }
        } catch (err: any) {
          console.error(`Error processing batch ${batchIndices}:`, err);
          throw err;
        }
      };

      const batches = [];
      for (let i = 0; i < totalPages; i += BATCH_SIZE) {
        const batch = [];
        for (let j = 0; j < BATCH_SIZE && i + j < totalPages; j++) {
          batch.push(i + j);
        }
        batches.push(batch);
      }

      const pool = [];
      for (const batch of batches) {
        const p = processBatch(batch);
        pool.push(p);
        if (pool.length >= CONCURRENCY_LIMIT) {
          await Promise.race(pool);
        }
      }
      await Promise.all(pool);

      const totalTime = Math.floor((Date.now() - startTime) / 1000);

      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        statusMessage: 'Digitization Complete! Your accessible document is ready.',
        progress: 100,
        totalTime
      }));
    } catch (err: any) {
      let userMessage = "An unexpected error occurred during digitization.";
      let workaround = "Please try refreshing the page or uploading a smaller file.";
      
      const errMsg = err.message?.toLowerCase() || "";
      
      if (errMsg.includes("quota") || errMsg.includes("rate limit") || errMsg.includes("429")) {
        userMessage = "High Traffic Detected (Rate Limit).";
        workaround = "We're processing many requests right now. Please wait 60 seconds and try again.";
      } else if (errMsg.includes("safety") || errMsg.includes("blocked")) {
        userMessage = "Content Restricted by Safety Filter.";
        workaround = "The AI was unable to process this page due to safety guidelines. Please ensure the content is strictly educational and clear.";
      } else if (errMsg.includes("output") || errMsg.includes("token") || errMsg.includes("cut off")) {
        userMessage = "Page Too Complex to Process.";
        workaround = "This page has a lot of content. Try splitting it into two separate images or scans for better results.";
      } else if (errMsg.includes("network") || errMsg.includes("fetch")) {
        userMessage = "Network Connection Issue.";
        workaround = "Please check your internet connection and try again.";
      }

      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: `${userMessage}|${workaround}`, 
        statusMessage: 'Error' 
      }));
    }
  };

  const handleRefineMath = async (activeTab: number) => {
    if (state.results.length === 0) return;
    setIsRefining(true);
    try {
      const page = state.results[activeTab];
      incrementRequestCount();
      const refinedHtml = await refineLatex(page.html);
      
      const newResults = [...state.results];
      newResults[activeTab] = { ...page, html: refinedHtml };
      setState(prev => ({ ...prev, results: newResults }));
    } catch (err) {
      console.error('Manual refinement failed:', err);
      alert('Failed to refine math on this page.');
    } finally {
      setIsRefining(false);
    }
  };

  const saveEditedFigures = (updates: { figureId: string, pageIndex: number, newSrc: string, newAlt?: string }[]) => {
    setState(prev => {
      const newResults = [...prev.results];
      
      updates.forEach(({ figureId, pageIndex, newSrc, newAlt }) => {
        const page = { ...newResults[pageIndex] };
        const figureIndex = page.figures.findIndex(f => f.id === figureId);
        
        if (figureIndex !== -1) {
          const newFigures = [...page.figures];
          const updatedFig = { ...newFigures[figureIndex], currentSrc: newSrc };
          if (newAlt !== undefined) updatedFig.alt = newAlt;
          newFigures[figureIndex] = updatedFig;
          page.figures = newFigures;
          
          const parser = new DOMParser();
          const doc = parser.parseFromString(page.html, 'text/html');
          const img = doc.querySelector(`img[data-figure-id="${figureId}"]`);
          const figure = img?.closest('figure');
          
          if (img && figure) {
            const cleanAlt = cleanAltText(newAlt || updatedFig.alt);
            img.setAttribute('src', newSrc);
            img.setAttribute('alt', cleanAlt);
            figure.setAttribute('aria-label', `Visual figure: ${cleanAlt}`);
            
            let figcaption = figure.querySelector('figcaption');
            if (!figcaption) {
              figcaption = doc.createElement('figcaption');
              figure.appendChild(figcaption);
            }
            figcaption.innerHTML = `Figure: ${newAlt || updatedFig.alt}`;
            
            page.html = doc.body.innerHTML;
          }
          newResults[pageIndex] = page;
        }
      });
      
      return { ...prev, results: newResults };
    });
  };

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      progress: 0,
      results: [],
      error: null,
      statusMessage: 'Waiting for upload...',
      sessionRequestCount: 0,
      dailyRequestCount: state.dailyRequestCount // Keep daily count
    });
    setOriginalFile(null);
    setElapsedTime(0);
    setIsRefining(false);
  }, [state.dailyRequestCount]);

  return {
    state,
    elapsedTime,
    originalFile,
    isRefining,
    handleFileUpload,
    handleRefineMath,
    saveEditedFigures,
    incrementRequestCount,
    reset
  };
};
