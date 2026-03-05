
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import ProcessingOverlay from './components/ProcessingOverlay';
import ImageEditor from './components/ImageEditor';
import Sidebar from './components/Sidebar';
import DocumentViewer from './components/DocumentViewer';
import PageNavigation from './components/PageNavigation';
import AccessibilityReport from './components/AccessibilityReport';
import { pdfToImageData } from './services/pdfService';
import { convertPageToHtml, recreateFigure, refineLatex } from './services/geminiService';
import { FigureResult, ConversionResult, AppState, LanguageLevel } from './types';
import { useRequestStats } from './hooks/useRequestStats';
import { useProcessingTimer } from './hooks/useProcessingTimer';
import { runAccessibilityAudit } from './utils/accessibility';
import { cropImage } from './utils/imageUtils';

const App: React.FC = () => {
  const { sessionCount, dailyCount, increment: incrementRequestCount } = useRequestStats();
  const [state, setState] = useState<AppState>({
    isProcessing: false,
    progress: 0,
    results: [],
    error: null,
    statusMessage: 'Waiting for upload...',
    sessionRequestCount: 0,
    dailyRequestCount: 0
  });

  // Sync state with hook
  useEffect(() => {
    setState(prev => ({ ...prev, sessionRequestCount: sessionCount, dailyRequestCount: dailyCount }));
  }, [sessionCount, dailyCount]);

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'source' | 'latex'>('preview');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showAuditReport, setShowAuditReport] = useState(false);
  const [languageLevel, setLanguageLevel] = useState<LanguageLevel>('faithful');
  const [editingFigures, setEditingFigures] = useState<{ id: string, src: string, originalSrc: string, alt: string, pageIndex: number }[] | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const elapsedTime = useProcessingTimer(state.isProcessing);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.MathJax && state.results.length > 0 && contentRef.current) {
      window.MathJax.typesetPromise([contentRef.current]).catch((err: any) => 
        console.error('MathJax error:', err)
      );

      // Attach edit listeners to buttons in the rendered HTML
      const editButtons = contentRef.current.querySelectorAll('.edit-figure-btn');
      editButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const figureId = (e.currentTarget as HTMLElement).getAttribute('data-figure-id');
          if (figureId) {
            handleEditFigure(activeTab, figureId);
          }
        });
      });
    }
  }, [state.results, activeTab, viewMode]);

  const handleEditFigure = (pageIndex: number, figureId: string) => {
    const page = state.results[pageIndex];
    const figure = page.figures.find(f => f.id === figureId);
    if (figure) {
      setEditingFigures([{ 
        id: figureId,
        pageIndex, 
        src: figure.currentSrc,
        originalSrc: figure.originalSrc,
        alt: figure.alt,
        width: figure.width,
        alignment: figure.alignment
      }]);
    }
  };

  const handleRefineMath = async () => {
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

  const handleBatchEdit = () => {
    const page = state.results[activeTab];
    if (page && page.figures.length > 0) {
      setEditingFigures(page.figures.map(f => ({
        id: f.id,
        pageIndex: activeTab,
        src: f.currentSrc,
        originalSrc: f.originalSrc,
        alt: f.alt,
        width: f.width,
        alignment: f.alignment
      })));
    } else {
      alert('No figures found on this page to batch edit.');
    }
  };

  const saveEditedFigures = (updates: { figureId: string, pageIndex: number, newSrc: string, newAlt?: string, newWidth?: string, newAlignment?: 'left' | 'center' | 'right' }[]) => {
    setState(prev => {
      const newResults = [...prev.results];
      
      updates.forEach(({ figureId, pageIndex, newSrc, newAlt, newWidth, newAlignment }) => {
        const page = { ...newResults[pageIndex] };
        const figureIndex = page.figures.findIndex(f => f.id === figureId);
        
        if (figureIndex !== -1) {
          const newFigures = [...page.figures];
          const updatedFig = { ...newFigures[figureIndex], currentSrc: newSrc };
          if (newAlt !== undefined) updatedFig.alt = newAlt;
          if (newWidth !== undefined) updatedFig.width = newWidth;
          if (newAlignment !== undefined) updatedFig.alignment = newAlignment;
          newFigures[figureIndex] = updatedFig;
          page.figures = newFigures;
          
          const parser = new DOMParser();
          const doc = parser.parseFromString(page.html, 'text/html');
          const img = doc.querySelector(`img[data-figure-id="${figureId}"]`);
          const figure = img?.closest('figure');
          
          if (img && figure) {
            // For the alt attribute, we keep the LaTeX but remove delimiters for better screen reader compatibility
            const cleanAlt = (newAlt || updatedFig.alt).replace(/\\\(|\\\)|\\\[|\\\]/g, '').replace(/"/g, '&quot;');
            img.setAttribute('src', newSrc);
            img.setAttribute('alt', cleanAlt);
            
            // Update figure style and alignment
            const alignment = newAlignment || updatedFig.alignment || 'center';
            const width = newWidth || updatedFig.width || '100%';
            
            figure.setAttribute('aria-label', `Visual figure: ${cleanAlt}`);
            figure.setAttribute('style', `width: ${width}`);
            
            // Update alignment classes
            figure.classList.remove('mx-auto', 'mr-auto', 'ml-auto');
            if (alignment === 'left') figure.classList.add('mr-auto');
            else if (alignment === 'right') figure.classList.add('ml-auto');
            else figure.classList.add('mx-auto');
            
            let figcaption = figure.querySelector('figcaption');
            if (!figcaption) {
              figcaption = doc.createElement('figcaption');
              figure.appendChild(figcaption);
            }
            // The figcaption IS rendered by MathJax, so we keep the delimiters
            figcaption.innerHTML = `Figure: ${newAlt || updatedFig.alt}`;
            
            page.html = doc.body.innerHTML;
          }
          newResults[pageIndex] = page;
        }
      });
      
      return { ...prev, results: newResults };
    });
    
    setEditingFigures(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
      const pageData = await pdfToImageData(file);
      const totalPages = pageData.length;
      
      // Process pages in parallel with a concurrency limit
      const CONCURRENCY_LIMIT = 3;
      const results: ConversionResult[] = new Array(totalPages);
      let completedPages = 0;

      const processPage = async (i: number) => {
        try {
          const updateProgress = (stepWeight: number) => {
            // Each page is 100 units.
            // - convertPageToHtml: 80 units
            // - figures: 20 units
            const currentProgress = (completedPages * 100 + stepWeight) / totalPages;
            setState(prev => ({ 
              ...prev, 
              progress: Math.min(99, currentProgress) 
            }));
          };

          updateProgress(10);
          setState(prev => ({ 
            ...prev, 
            statusMessage: `Digitizing Page ${i + 1} of ${totalPages}...`,
          }));

          incrementRequestCount();
          const geminiResponse = await convertPageToHtml(pageData[i].base64, i + 1, languageLevel);
          updateProgress(80);
          
          let finalHtml = geminiResponse.html;
          
          setState(prev => ({ 
            ...prev, 
            statusMessage: `Extracting visual figures from Page ${i + 1}...`,
          }));

          // Process figures
          const figureResults: FigureResult[] = geminiResponse.figures.map((fig) => {
            const screenshotBase64 = cropImage(pageData[i].canvas, fig);
            // Calculate proportional width (normalized 0-1000 coordinates)
            const proportionalWidth = Math.min(100, Math.max(25, Math.round((fig.box_2d[3] - fig.box_2d[1]) / 10)));
            return {
              id: fig.id,
              originalSrc: screenshotBase64,
              currentSrc: screenshotBase64,
              alt: fig.alt,
              width: `${proportionalWidth}%`,
              alignment: 'center'
            };
          });
          
          figureResults.forEach(figResult => {
            const imgTagRegex = new RegExp(`<img[^>]*id=["']${figResult.id}["'][^>]*>`, 'g');
            // For the alt attribute, we keep the LaTeX but remove delimiters for better screen reader compatibility
            // unless the user specifically wants them. The user mentioned "inconsistent rendering", 
            // so we'll ensure the figcaption (which IS rendered) is robust.
            const cleanAlt = figResult.alt.replace(/\\\(|\\\)|\\\[|\\\]/g, '').replace(/"/g, '&quot;');
            const alignmentClass = figResult.alignment === 'left' ? 'mr-auto' : figResult.alignment === 'right' ? 'ml-auto' : 'mx-auto';
            const figureHtml = `
              <figure class="my-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center group/fig ${alignmentClass}" style="width: ${figResult.width || '100%'}" role="group" aria-label="Visual figure: ${cleanAlt}">
                <div class="relative overflow-hidden rounded-lg shadow-sm border border-slate-200 bg-white w-full">
                  <img src="${figResult.currentSrc}" alt="${cleanAlt}" class="w-full h-auto" data-figure-id="${figResult.id}">
                  <button class="edit-figure-btn absolute top-2 right-2 p-2 bg-white/90 backdrop-blur shadow-lg rounded-lg opacity-0 group-hover/fig:opacity-100 transition-all hover:bg-indigo-600 hover:text-white" data-figure-id="${figResult.id}" title="Edit Figure">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </button>
                </div>
                <figcaption class="mt-4 text-sm text-slate-700 font-sans text-center italic" aria-hidden="true">
                  Figure: ${figResult.alt}
                </figcaption>
              </figure>
            `;
            finalHtml = finalHtml.replace(imgTagRegex, figureHtml);
          });
          updateProgress(100);

          const audit = runAccessibilityAudit(finalHtml);

          results[i] = { 
            html: finalHtml, 
            latex: geminiResponse.latex,
            pageNumber: i + 1,
            width: pageData[i].width,
            height: pageData[i].height,
            orientation: pageData[i].orientation,
            fontSize: 18,
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
        } catch (err: any) {
          console.error(`Error processing page ${i + 1}:`, err);
          throw err;
        }
      };

      // Simple concurrency pool
      const pool = [];
      for (let i = 0; i < totalPages; i++) {
        const p = processPage(i);
        pool.push(p);
        if (pool.length >= CONCURRENCY_LIMIT) {
          await Promise.race(pool);
          // Remove completed promises from pool
          // This is a bit simplified, but works for small sets
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
      setActiveTab(0);
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: err.message, statusMessage: 'Error' }));
    }
  };

  const handleDownloadOriginal = () => {
    if (!originalFile) return;
    const url = URL.createObjectURL(originalFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = originalFile.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const timestamp = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    const firstPageHtml = state.results[0]?.html || '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(firstPageHtml, 'text/html');
    const firstHeading = doc.querySelector('h1, h2, h3');
    const extractedTitle = firstHeading ? firstHeading.textContent?.trim() : 'Mathematics Course Notes';
    const metaTop = firstHeading ? 'Lecture Notes' : 'Archive Digitization';

    const originalFileName = originalFile?.name || '';

    const cleanResults = state.results.map(r => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(r.html, 'text/html');
      doc.querySelectorAll('.edit-figure-btn').forEach(btn => btn.remove());
      return { ...r, html: doc.body.innerHTML };
    });

    const docOrientation = state.results[0]?.orientation || 'portrait';

    const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${extractedTitle} - Accessible Math Notes</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        window.MathJax = { 
          tex: { 
            inlineMath: [['\\\\(', '\\\\)']], 
            displayMath: [['\\\\[', '\\\\]']],
            processEscapes: true
          },
          options: { renderActions: { addMenu: [0, '', ''] } }
        };
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@400;600&display=swap');
        
        :root {
            --bg: #fdfdfd;
            --ink: #1e293b;
            --heading-color: #0f172a;
            --accent: #4f46e5;
            --link-color: #4338ca;
        }

        html {
            scroll-behavior: smooth;
        }

        body { 
            font-family: 'Inter', system-ui, sans-serif; 
            background-color: var(--bg); 
            color: var(--ink); 
            margin: 0; 
            padding: 0; 
            line-height: 1.7;
        }

        .container {
            width: 100%;
            margin: 0 auto;
            padding: 2rem;
            max-width: ${docOrientation === 'landscape' ? '1200px' : '900px'};
            transition: all 0.3s ease;
        }

        .page-article {
            font-size: 1.125rem; /* Default */
            margin-bottom: 6rem;
        }
        
        ${cleanResults.map(r => `
        #page-${r.pageNumber} { font-size: ${r.fontSize}px; }
        `).join('\n')}

        @media (min-width: 1024px) {
            .layout {
                display: grid;
                grid-template-columns: ${docOrientation === 'landscape' ? '1fr' : '200px 1fr'};
                gap: 6rem;
                align-items: start;
                padding-top: 4rem;
                transition: all 0.3s ease;
                max-width: 1400px;
                margin: 0 auto;
            }
            .layout.sidebar-hidden {
                grid-template-columns: 1fr;
                gap: 0;
                max-width: none;
            }
            .sidebar {
                position: sticky;
                top: 4rem;
                display: ${docOrientation === 'landscape' ? 'none' : 'block'};
            }
            .sidebar.hidden {
                display: none !important;
            }
            .content-expanded {
                max-width: none;
                margin: 0;
            }
        }

        @page {
            size: A4 ${docOrientation};
            margin: 1cm;
        }

        .sidebar {
            display: none;
        }

        .toggle-sidebar-btn {
            position: fixed;
            bottom: 2rem;
            left: 2rem;
            z-index: 50;
            background: var(--accent);
            color: white;
            border: none;
            border-radius: 9999px;
            width: 3.5rem;
            height: 3.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            transition: all 0.2s;
        }

        .toggle-sidebar-btn:hover {
            transform: scale(1.1);
            background: var(--link-color);
        }

        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border-width: 0;
        }

        .sidebar-title {
            font-size: 0.7rem;
            font-weight: 800;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 1.5rem;
        }

        .sidebar-nav {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .sidebar-nav li {
            margin-bottom: 0.75rem;
        }

        .sidebar-nav a {
            font-size: 0.85rem;
            text-decoration: none;
            color: #64748b;
            font-weight: 600;
            transition: color 0.2s;
        }

        .sidebar-nav a:hover {
            color: var(--accent);
        }

        article, section { 
            margin-bottom: 2rem; 
            position: relative; 
            width: 100%; 
            background: white;
            padding: 0;
        }

        .math-content { 
            color: var(--ink); 
        }

        .math-content p {
            margin-bottom: 1.5rem;
        }

        .page-badge { 
            display: inline-block;
            margin-bottom: 2rem;
            padding: 0.35rem 0.85rem; 
            background: #f1f5f9;
            color: #475569; 
            font-family: 'Inter', sans-serif;
            font-size: 0.7rem; 
            font-weight: 800; 
            text-transform: uppercase;
            border-radius: 9999px;
            letter-spacing: 0.05em;
        }

        .notebox { 
            border: 1px solid #e2e8f0;
            border-left: 4px solid var(--accent); 
            padding: 2rem; 
            margin: 3rem 0; 
            background-color: #f8fafc; 
            font-style: normal; 
            color: #334155; 
            border-radius: 0.75rem;
            shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }

        h1, h2, h3, h4 {
            font-family: 'Inter', sans-serif;
            color: var(--heading-color);
            margin-top: 4rem;
            margin-bottom: 1.5rem;
            line-height: 1.2;
            font-weight: 800;
            letter-spacing: -0.02em;
        }

        h1 { font-size: 2.5rem; }
        h2 { font-size: 2rem; }
        h3 { font-size: 1.5rem; }

        a {
            color: var(--link-color);
            text-decoration: underline;
            text-underline-offset: 4px;
            font-weight: 600;
            transition: all 0.2s;
        }

        a:hover {
            color: var(--accent);
            text-decoration-thickness: 2px;
        }

        figure {
            margin: 4rem 0;
            padding: 2rem;
            background: #fff;
            border: 1px solid #f1f5f9;
            border-radius: 1rem;
            text-align: center;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }

        figcaption {
            font-family: 'Inter', sans-serif;
            font-size: 0.875rem;
            color: #334155;
            margin-top: 1.5rem;
            font-style: italic;
            font-weight: 500;
        }

        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
        }

        /* Accessibility: focus styles */
        a:focus, button:focus {
            outline: 3px solid var(--accent);
            outline-offset: 2px;
        }

        @media print {
            body { font-size: 12pt; }
            .container { max-width: none; padding: 0; }
            article, section { 
                padding: 0; 
                margin-bottom: 0; 
                page-break-inside: avoid; 
            }
            .page-badge { display: none; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <button id="sidebar-toggle" class="no-print toggle-sidebar-btn" aria-label="Toggle navigation sidebar" aria-expanded="true" aria-controls="sidebar-nav">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    </button>
    <div class="container">
        <div id="main-layout" class="layout">
            <nav id="sidebar-nav" class="sidebar no-print" aria-label="Document navigation">
                <div class="sidebar-title">Contents</div>
                <ul class="sidebar-nav">
                    ${cleanResults.map(r => `
                    <li><a href="#page-${r.pageNumber}">Page ${r.pageNumber}</a></li>
                    `).join('')}
                </ul>
            </nav>
            <main class="content" style="padding-bottom: 12rem;">
                ${cleanResults.map((r, idx) => `
                <article id="page-${r.pageNumber}" role="region" class="page-article">
                    ${idx === 0 && originalFileName ? `
                    <div class="no-print" style="position: absolute; top: 0; right: 0;">
                        <a href="${originalFileName}" class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#CFB991] text-black rounded-xl font-black text-[11px] hover:bg-[#B19B69] transition-all border-2 border-black no-underline tracking-widest shadow-xl transform hover:-translate-y-0.5 active:translate-y-0">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download original notes
                        </a>
                    </div>` : ''}
                    <span class="page-badge">PAGE ${r.pageNumber}</span>
                    <div class="math-content">
                        ${r.html}
                    </div>
                </article>`).join('\n')}
            </main>
        </div>
    </div>
    <script>
        const toggleBtn = document.getElementById('sidebar-toggle');
        const layout = document.getElementById('main-layout');
        const sidebar = document.getElementById('sidebar-nav');
        const articles = document.querySelectorAll('.page-article');

        toggleBtn.addEventListener('click', () => {
            const isHidden = sidebar.classList.toggle('hidden');
            layout.classList.toggle('sidebar-hidden');
            toggleBtn.setAttribute('aria-expanded', !isHidden);
            
            articles.forEach(article => {
                if (isHidden) {
                    article.classList.add('content-expanded');
                } else {
                    article.classList.remove('content-expanded');
                }
            });
        });

        // Hide toggle on mobile or if document is landscape
        function checkMobile() {
            const isLandscape = ${docOrientation === 'landscape'};
            if (window.innerWidth < 1024 || isLandscape) {
                toggleBtn.style.display = 'none';
                if (isLandscape) {
                    layout.classList.add('sidebar-hidden');
                }
            } else {
                toggleBtn.style.display = 'flex';
            }
        }
        window.addEventListener('resize', checkMobile);
        checkMobile();
    </script>
</body>
</html>`;

    const blob = new Blob([template], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const baseFileName = originalFile ? originalFile.name.replace(/\.[^/.]+$/, "") : `math_notes_${new Date().getTime()}`;
    link.download = `${baseFileName}-acc.html`;
    link.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header onShowDocs={() => setShowHelp(true)} />
      
      {state.isProcessing && (
        <ProcessingOverlay 
          progress={state.progress} 
          status={state.statusMessage} 
          elapsedTime={elapsedTime} 
          sessionRequestCount={state.sessionRequestCount}
          dailyRequestCount={state.dailyRequestCount}
        />
      )}

      <AnimatePresence>
        {showAuditReport && (
          <AccessibilityReport 
            result={state.results[activeTab]} 
            onClose={() => setShowAuditReport(false)} 
          />
        )}
      </AnimatePresence>

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-10 relative overflow-hidden">
            <button 
              onClick={() => setShowHelp(false)}
              className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">How it works</h2>
              <p className="text-slate-500 font-medium">Get the most out of Q.E.D.</p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black text-slate-400">01</div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Upload Files</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Upload a PDF, image (JPG, PNG, HEIC), or text file containing mathematics. For best results, ensure scans are clear.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black text-slate-400">02</div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">AI Digitization</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Our AI transcribes handwriting into LaTeX and semantic HTML, while preserving graphs and diagrams as accessible figures.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black text-slate-400">03</div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Export & Share</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Download the result as a standalone, WCAG 2.2 AA compliant HTML file—because while your proofs are rigorous, your handwriting shouldn’t be a test of faith.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowHelp(false)}
              className="mt-10 w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {editingFigures && (
          <ImageEditor 
            figures={editingFigures}
            onSave={saveEditedFigures}
            onClose={() => setEditingFigures(null)}
            onApiCall={incrementRequestCount}
          />
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-[1800px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8" role="main">
        {!state.results.length && !state.isProcessing ? (
          <div className="max-w-6xl mx-auto mt-12 text-center p-16 border-2 border-dashed border-slate-200 rounded-[3rem]">
            <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-8">Ready to <span className="text-indigo-600">Digitize.</span></h2>
            
            <div className="max-w-md mx-auto mb-12 bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Adaptation Level</h3>
              <div className="grid grid-cols-3 gap-2">
                {(['faithful', 'natural', 'fleshed_out'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setLanguageLevel(level)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${languageLevel === level ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                  >
                    {level === 'faithful' ? 'Faithful' : level === 'natural' ? 'Natural' : 'Fleshed Out'}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-[10px] text-slate-400 leading-relaxed">
                {languageLevel === 'faithful' ? 'Transcribes exactly as written.' : languageLevel === 'natural' ? 'Converts to natural, complete sentences.' : 'Expands notes with detailed explanations.'}
              </p>
            </div>

            <label className="inline-flex items-center gap-4 px-12 py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl transition-all cursor-pointer">
              <span>Upload File</span>
              <input type="file" className="sr-only" accept="application/pdf,image/*,.heic,.heif,.txt" onChange={handleFileUpload} />
            </label>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <aside className="w-full lg:w-64 flex-shrink-0 space-y-4 lg:sticky lg:top-24">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-[10px] uppercase tracking-widest">Accessibility</h3>
                  <div className={`px-2 py-0.5 rounded-full text-[9px] font-black ${state.results[activeTab]?.audit.score === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {state.results[activeTab]?.audit.score}% AA
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${state.results[activeTab]?.audit.score === 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                      style={{ width: `${state.results[activeTab]?.audit.score || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  {state.results[activeTab]?.audit.checks.map((check, idx) => (
                    <div key={idx} className="group relative">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 flex items-center justify-center ${check.passed ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                          {check.passed ? (
                            <svg className="w-1.5 h-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          ) : (
                            <span className="text-[8px] font-bold">!</span>
                          )}
                        </div>
                        <span className={`text-[9px] font-bold leading-tight ${check.passed ? 'text-slate-500' : 'text-amber-600'}`}>{check.title}</span>
                      </div>
                      <div className="hidden group-hover:block absolute left-full ml-4 top-0 w-56 p-4 bg-slate-800 text-white text-[10px] rounded-xl shadow-2xl z-50">
                        <p className="font-bold mb-1">{check.description}</p>
                        {check.suggestion && (
                          <p className="text-amber-300 mt-2 flex items-start gap-1">
                            <span className="font-black">Fix:</span> {check.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setShowAuditReport(true)}
                  className="w-full py-2 mb-6 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                >
                  View Full Report
                </button>

                <Sidebar 
                  activeTab={activeTab}
                  results={state.results}
                  isRefining={isRefining}
                  onFontSizeChange={(newSize) => {
                    setState(prev => {
                      const newResults = [...prev.results];
                      newResults[activeTab] = { ...newResults[activeTab], fontSize: newSize };
                      return { ...prev, results: newResults };
                    });
                  }}
                  onRefineMath={handleRefineMath}
                  onBatchEdit={handleBatchEdit}
                  onDownloadHtml={handleDownloadHtml}
                />
              </div>

              <nav className="bg-slate-50 p-6 rounded-3xl border border-slate-100 max-h-[400px] overflow-y-auto">
                <h3 className="font-bold text-slate-900 mb-4 text-[10px] uppercase tracking-widest">Pages</h3>
                <PageNavigation 
                  results={state.results}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
              </nav>
            </aside>

            <div className="flex-1 w-full flex flex-col items-center">
              <div className="w-full max-w-none">
                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                   <div className="flex gap-4">
                      <button onClick={() => setViewMode('preview')} className={`text-[11px] font-black tracking-widest ${viewMode === 'preview' ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'}`}>PREVIEW</button>
                      <button onClick={() => setViewMode('source')} className={`text-[11px] font-black tracking-widest ${viewMode === 'source' ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'}`}>HTML</button>
                      <button onClick={() => setViewMode('latex')} className={`text-[11px] font-black tracking-widest ${viewMode === 'latex' ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'}`}>LATEX</button>
                   </div>
                   <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Page {activeTab + 1} of {state.results.length}</div>
                </div>

                <div className="min-h-[800px] pb-32">
                  <DocumentViewer 
                    viewMode={viewMode}
                    activeTab={activeTab}
                    results={state.results}
                    contentRef={contentRef}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .notebox {
          border-left: 4px solid #e2e8f0;
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          background-color: #f8fafc;
          border-radius: 0 1rem 1rem 0;
          font-style: italic;
          color: #475569;
        }
        @media print {
          @page { size: A4 ${state.results[activeTab]?.orientation || 'portrait'}; margin: 1cm; }
          header, aside, button, label, .border-b { display: none !important; }
          main, .flex-1, .w-full { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; }
          article, section { border: none !important; padding: 0 !important; margin: 0 !important; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default App;
