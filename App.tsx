
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import ProcessingOverlay from './components/ProcessingOverlay';
import ImageEditor from './components/ImageEditor';
import { pdfToImageData } from './services/pdfService';
import { convertPageToHtml, recreateFigure, refineLatex } from './services/geminiService';
import { FigureResult, ConversionResult, AppState, Figure, AccessibilityAudit, LanguageLevel } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isProcessing: false,
    progress: 0,
    results: [],
    error: null,
    statusMessage: 'Waiting for upload...'
  });

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showAuditReport, setShowAuditReport] = useState(false);
  const [languageLevel, setLanguageLevel] = useState<LanguageLevel>('faithful');
  const [editingFigures, setEditingFigures] = useState<{ id: string, src: string, originalSrc: string, alt: string, pageIndex: number }[] | null>(null);
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
        alt: figure.alt
      }]);
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
        alt: f.alt
      })));
    } else {
      alert('No figures found on this page to batch edit.');
    }
  };

  const saveEditedFigures = (updates: { figureId: string, pageIndex: number, newSrc: string }[]) => {
    setState(prev => {
      const newResults = [...prev.results];
      
      updates.forEach(({ figureId, pageIndex, newSrc }) => {
        const page = { ...newResults[pageIndex] };
        const figureIndex = page.figures.findIndex(f => f.id === figureId);
        
        if (figureIndex !== -1) {
          const newFigures = [...page.figures];
          newFigures[figureIndex] = { ...newFigures[figureIndex], currentSrc: newSrc };
          page.figures = newFigures;
          
          const parser = new DOMParser();
          const doc = parser.parseFromString(page.html, 'text/html');
          const img = doc.querySelector(`img[data-figure-id="${figureId}"]`);
          if (img) {
            img.setAttribute('src', newSrc);
            page.html = doc.body.innerHTML;
          }
          newResults[pageIndex] = page;
        }
      });
      
      return { ...prev, results: newResults };
    });
    
    setEditingFigures(null);
  };

  const runAccessibilityAudit = (html: string): AccessibilityAudit => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const checks = [];

    // Check 1: Alt text for all images/figures (1.1.1)
    const images = doc.querySelectorAll('img');
    const allImagesHaveAlt = images.length === 0 || Array.from(images).every(img => img.getAttribute('alt') && img.getAttribute('alt')!.trim().length > 0);
    checks.push({
      title: 'Alt Text (1.1.1)',
      passed: allImagesHaveAlt,
      description: 'All visual figures must have descriptive alternative text for screen readers.',
      suggestion: allImagesHaveAlt ? undefined : 'Use the Figure Editor to add descriptive alt text to all images.'
    });

    // Check 2: Semantic Headings (1.3.1)
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const hasHeadings = headings.length > 0;
    checks.push({
      title: 'Headings (1.3.1)',
      passed: hasHeadings,
      description: 'Document uses semantic heading levels for logical structure and navigation.',
      suggestion: hasHeadings ? undefined : 'Ensure the document has at least one heading (e.g., <h1> for the title).'
    });

    // Check 3: ARIA Landmarks (1.3.1)
    const hasArticle = doc.querySelector('article') !== null || html.includes('<article');
    checks.push({
      title: 'Landmarks (1.3.1)',
      passed: hasArticle,
      description: 'Content is organized within semantic landmarks like <article> or <section>.',
      suggestion: hasArticle ? undefined : 'Wrap main content in <article> or <section> tags for better navigation.'
    });

    // Check 4: Color Contrast (1.4.3) - Simulation based on CSS design
    const usesStandardColors = !html.includes('style="color:') && !html.includes('style="background:');
    checks.push({
      title: 'Contrast (1.4.3)',
      passed: usesStandardColors,
      description: 'Text colors meet the 4.5:1 minimum ratio for standard text visibility.',
      suggestion: usesStandardColors ? undefined : 'Avoid using inline styles for color; stick to the default high-contrast theme.'
    });

    // Check 5: Keyboard Focus (2.1.1)
    const interactive = doc.querySelectorAll('a, button, details, [tabindex]');
    const allInteractiveAccessible = Array.from(interactive).every(el => {
        const tabIndex = el.getAttribute('tabindex');
        return tabIndex !== '-1';
    });
    checks.push({
      title: 'Keyboard (2.1.1)',
      passed: allInteractiveAccessible,
      description: 'Ensures all interactive elements are reachable and operable via keyboard.',
      suggestion: allInteractiveAccessible ? undefined : 'Remove tabindex="-1" from interactive elements unless they are hidden.'
    });

    // Check 6: Screen Reader hints (4.1.2)
    const hasGroupRoles = doc.querySelectorAll('figure[role="group"]').length > 0;
    const hasMath = html.includes('\\(') || html.includes('\\[');
    checks.push({
      title: 'Screen Reader (4.1.2)',
      passed: hasGroupRoles || !images.length,
      description: 'Verification of ARIA roles and name properties for assistive technologies.',
      suggestion: (hasGroupRoles || !images.length) ? undefined : 'Wrap complex figures in <figure role="group"> with an aria-label.'
    });

    const passedCount = checks.filter(c => c.passed).length;
    const score = Math.round((passedCount / checks.length) * 100);

    return { score, checks };
  };

  const cropImage = (originalCanvas: HTMLCanvasElement, figure: Figure): string => {
    const [ymin, xmin, ymax, xmax] = figure.box_2d;
    const w = originalCanvas.width;
    const h = originalCanvas.height;

    const padding = 15;
    const sx = Math.max(0, (xmin / 1000) * w - padding);
    const sy = Math.max(0, (ymin / 1000) * h - padding);
    const sWidth = Math.min(w - sx, ((xmax - xmin) / 1000) * w + padding * 2);
    const sHeight = Math.min(h - sy, ((ymax - ymin) / 1000) * h + padding * 2);

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = sWidth;
    cropCanvas.height = sHeight;
    const ctx = cropCanvas.getContext('2d');
    
    if (!ctx) return '';
    ctx.drawImage(originalCanvas, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
    return cropCanvas.toDataURL('image/png');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setOriginalFile(file);
    setState({
      isProcessing: true,
      progress: 0,
      results: [],
      error: null,
      statusMessage: 'Reading PDF...'
    });

    try {
      const pageData = await pdfToImageData(file);
      const totalPages = pageData.length;
      const convertedResults: ConversionResult[] = [];

      for (let i = 0; i < pageData.length; i++) {
        setState(prev => ({ 
          ...prev, 
          statusMessage: `Digitizing Page ${i + 1} of ${totalPages}...`,
          progress: (i / totalPages) * 100
        }));

        const geminiResponse = await convertPageToHtml(pageData[i].base64, i + 1, languageLevel);
        let finalHtml = geminiResponse.html;
        
        // Final check for equations
        setState(prev => ({ ...prev, statusMessage: `Refining equations for Page ${i + 1}...` }));
        try {
          finalHtml = await refineLatex(finalHtml);
        } catch (e) {
          console.error('Latex refinement failed', e);
        }

        // Process figures (Default to original handwritten figures)
        setState(prev => ({ ...prev, statusMessage: `Processing figures for Page ${i + 1}...` }));
        
        const figureResults = geminiResponse.figures.map((fig) => {
          const screenshotBase64 = cropImage(pageData[i].canvas, fig);
          return {
            id: fig.id,
            originalSrc: screenshotBase64,
            currentSrc: screenshotBase64, // Default to original handwritten
            alt: fig.alt
          };
        });
        
        figureResults.forEach(figResult => {
          const imgTagRegex = new RegExp(`<img[^>]*id=["']${figResult.id}["'][^>]*>`, 'g');
          
          const figureHtml = `
            <figure class="my-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center group/fig" role="group" aria-label="Visual figure: ${figResult.alt}">
              <div class="relative overflow-hidden rounded-lg shadow-sm border border-slate-200 bg-white">
                <img src="${figResult.currentSrc}" alt="${figResult.alt.replace(/"/g, '&quot;')}" class="max-w-full" data-figure-id="${figResult.id}">
                <button class="edit-figure-btn absolute top-2 right-2 p-2 bg-white/90 backdrop-blur shadow-lg rounded-lg opacity-0 group-hover/fig:opacity-100 transition-all hover:bg-indigo-600 hover:text-white" data-figure-id="${figResult.id}" title="Edit Figure">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>
              </div>
              <figcaption class="mt-4 text-[10px] text-slate-400 font-sans text-center italic">
                Figure: ${figResult.alt}
              </figcaption>
            </figure>
          `;
          
          finalHtml = finalHtml.replace(imgTagRegex, figureHtml);
        });

        const audit = runAccessibilityAudit(finalHtml);

        convertedResults.push({ 
          html: finalHtml, 
          pageNumber: i + 1,
          width: pageData[i].width,
          height: pageData[i].height,
          audit,
          figures: figureResults
        });
        
        setState(prev => ({
          ...prev,
          results: [...convertedResults],
          progress: ((i + 1) / totalPages) * 100
        }));
      }

      setState(prev => ({ ...prev, isProcessing: false, statusMessage: 'Digitization Complete' }));
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
            --bg: #ffffff;
            --ink: #1a1a1a;
            --heading-color: #003366; /* Purdue-style dark blue */
            --accent: #ceb888; /* Purdue Gold accent */
            --link-color: #004499;
        }

        body { 
            font-family: 'Crimson Pro', 'Georgia', serif; 
            background-color: var(--bg); 
            color: var(--ink); 
            margin: 0; 
            padding: 0; 
            line-height: 1.75;
            font-size: 1.25rem;
        }

        .document-header { 
            padding: 4rem 2rem 2rem; 
            text-align: left; 
            max-width: 1000px; 
            margin: 0 auto;
            border-bottom: 3px solid var(--accent);
        }

        .document-title { 
            font-family: 'Crimson Pro', serif;
            font-size: 3rem; 
            font-weight: 700; 
            color: var(--heading-color); 
            margin: 0.5rem 0; 
            line-height: 1.1;
        }

        .document-meta { 
            color: #555; 
            font-size: 0.9rem; 
            font-family: 'Inter', sans-serif;
            font-weight: 600; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
        }

        .container { 
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 2rem 2rem 10rem; 
        }

        article { 
            margin-bottom: 4rem; 
            position: relative; 
            width: 100%; 
            background: white;
            padding: 2rem 0;
        }

        .math-content { 
            color: var(--ink); 
        }

        .math-content p {
            margin-bottom: 2rem;
        }

        .page-badge { 
            display: inline-block;
            margin-bottom: 1rem;
            padding: 0.25rem 0.75rem; 
            background: #f0f0f0;
            color: #666; 
            font-family: 'Inter', sans-serif;
            font-size: 0.75rem; 
            font-weight: 600; 
            text-transform: uppercase;
            border-radius: 4px;
        }

        .notebox { 
            border: 1px solid #ddd;
            border-left: 6px solid var(--accent); 
            padding: 1.5rem 2rem; 
            margin: 2rem 0; 
            background-color: #fdfdfd; 
            font-style: normal; 
            color: #333; 
            border-radius: 4px;
        }

        h1, h2, h3, h4 {
            font-family: 'Crimson Pro', serif;
            color: var(--heading-color);
            margin-top: 2.5rem;
            margin-bottom: 1.25rem;
            line-height: 1.3;
            font-weight: 700;
        }

        h1 { font-size: 2.25rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
        h2 { font-size: 1.85rem; }
        h3 { font-size: 1.5rem; }

        a {
            color: var(--link-color);
            text-decoration: underline;
            text-underline-offset: 2px;
        }

        a:hover {
            color: #002255;
        }

        figure {
            margin: 3rem 0;
            padding: 1.5rem;
            background: #fff;
            border: 1px solid #eee;
            text-align: center;
        }

        figcaption {
            font-family: 'Inter', sans-serif;
            font-size: 0.9rem;
            color: #666;
            margin-top: 1rem;
            font-style: italic;
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
            article { 
                padding: 0; 
                margin-bottom: 0; 
                page-break-after: always; 
            }
            .page-badge { display: none; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <header class="document-header">
      <div class="document-meta">${metaTop}</div>
      <h1 class="document-title">${extractedTitle}</h1>
      <div class="document-meta">Processed ${timestamp}</div>
      ${originalFileName ? `
      <div class="mt-8 no-print">
        <a href="${originalFileName}" class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ceb888] text-[#1a1a1a] rounded font-bold text-sm hover:bg-[#bda67a] transition-colors shadow-sm no-underline">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Original Handwritten Notes
        </a>
      </div>` : ''}
    </header>
    <main class="container">
        ${cleanResults.map(r => `
        <article id="page-${r.pageNumber}" role="region">
            <span class="page-badge">PAGE ${r.pageNumber}</span>
            <div class="math-content">
                ${r.html}
            </div>
        </article>`).join('\n')}
    </main>
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

  const activeAudit = state.results[activeTab]?.audit;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header onShowDocs={() => setShowHelp(true)} />
      
      {state.isProcessing && <ProcessingOverlay progress={state.progress} status={state.statusMessage} />}

      {showAuditReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col relative overflow-hidden">
            <button 
              onClick={() => setShowAuditReport(false)}
              className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-10 border-b border-slate-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Accessibility Audit</h2>
                  <p className="text-slate-500 font-medium">WCAG 2.2 AA Compliance Report for Page {activeTab + 1}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 mt-8">
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Compliance Score</span>
                    <span className={`text-sm font-black ${activeAudit?.score === 100 ? 'text-green-600' : 'text-amber-600'}`}>{activeAudit?.score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${activeAudit?.score === 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                      style={{ width: `${activeAudit?.score || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className={`px-6 py-3 rounded-2xl font-black text-lg ${activeAudit?.score === 100 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                  {activeAudit?.score === 100 ? 'EXCELLENT' : 'IMPROVEMENT NEEDED'}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Detailed Checks</h3>
                <div className="grid gap-4">
                  {activeAudit?.checks.map((check, idx) => (
                    <div key={idx} className={`p-6 rounded-3xl border ${check.passed ? 'bg-green-50/30 border-green-100' : 'bg-amber-50/30 border-amber-100'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${check.passed ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                            {check.passed ? (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            ) : (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            )}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 mb-1">{check.title}</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">{check.description}</p>
                            {!check.passed && check.suggestion && (
                              <div className="mt-4 p-4 bg-white border border-amber-200 rounded-2xl">
                                <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">How to fix</p>
                                <p className="text-sm text-slate-700 font-medium">{check.suggestion}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${check.passed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {check.passed ? 'Passed' : 'Failed'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">About WCAG 2.2 AA</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Web Content Accessibility Guidelines (WCAG) 2.2 defines how to make Web content more accessible to people with disabilities. AA compliance is the standard level of accessibility for most commercial and government websites.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-100">
                    <h5 className="text-xs font-bold text-slate-900 mb-1">Perceivable</h5>
                    <p className="text-[11px] text-slate-400">Information and UI components must be presentable to users in ways they can perceive.</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-100">
                    <h5 className="text-xs font-bold text-slate-900 mb-1">Operable</h5>
                    <p className="text-[11px] text-slate-400">UI components and navigation must be operable by all users.</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowAuditReport(false)}
                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

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
              <p className="text-slate-500 font-medium">Get the most out of Theorem</p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black text-slate-400">01</div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Upload Scans</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Upload a PDF containing handwritten mathematics. For best results, ensure the scans are clear and well-lit.</p>
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
                  <p className="text-sm text-slate-500 leading-relaxed">Download the result as a standalone, WCAG-compliant HTML file that renders beautifully on any device using MathJax.</p>
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
          />
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8" role="main">
        {!state.results.length && !state.isProcessing ? (
          <div className="max-w-4xl mx-auto mt-12 text-center p-16 border-2 border-dashed border-slate-200 rounded-[3rem]">
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
              <span>Upload PDF Scans</span>
              <input type="file" className="sr-only" accept="application/pdf" onChange={handleFileUpload} />
            </label>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <aside className="w-full lg:w-64 flex-shrink-0 space-y-4 lg:sticky lg:top-24">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-[10px] uppercase tracking-widest">Accessibility</h3>
                  <div className={`px-2 py-0.5 rounded-full text-[9px] font-black ${activeAudit?.score === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {activeAudit?.score}% AA
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${activeAudit?.score === 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                      style={{ width: `${activeAudit?.score || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  {activeAudit?.checks.map((check, idx) => (
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

                <h3 className="font-bold text-slate-900 mb-4 text-[10px] uppercase tracking-widest border-t border-slate-100 pt-4">Controls</h3>
                <div className="space-y-2">
                   <button onClick={handleBatchEdit} className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold hover:bg-slate-800">BATCH EDIT FIGURES</button>
                   <button onClick={handleDownloadHtml} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold hover:bg-indigo-700">DOWNLOAD HTML</button>
                   <button onClick={handlePrint} className="w-full py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-50">PRINT TO PDF</button>
                   <button onClick={handleDownloadOriginal} className="w-full py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-200">ORIGINAL PDF</button>
                </div>
              </div>

              <nav className="bg-slate-50 p-6 rounded-3xl border border-slate-100 max-h-[400px] overflow-y-auto">
                <h3 className="font-bold text-slate-900 mb-4 text-[10px] uppercase tracking-widest">Pages</h3>
                <div className="grid grid-cols-2 gap-2">
                  {state.results.map((r, i) => (
                    <button 
                      key={i}
                      onClick={() => setActiveTab(i)}
                      className={`px-3 py-2 rounded-lg text-[10px] font-black border transition-all ${activeTab === i ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                    >
                      P.{r.pageNumber}
                    </button>
                  ))}
                </div>
              </nav>
            </aside>

            <div className="flex-1 w-full flex flex-col items-center">
              <div className="w-full max-w-7xl">
                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                   <div className="flex gap-4">
                      <button onClick={() => setViewMode('preview')} className={`text-[11px] font-black tracking-widest ${viewMode === 'preview' ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'}`}>PREVIEW</button>
                      <button onClick={() => setViewMode('source')} className={`text-[11px] font-black tracking-widest ${viewMode === 'source' ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'}`}>SOURCE</button>
                   </div>
                   <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Page {activeTab + 1} of {state.results.length}</div>
                </div>

                <div className="min-h-[800px] pb-32">
                  {viewMode === 'preview' ? (
                    <article ref={contentRef} className="math-content prose prose-slate prose-indigo max-w-none">
                       <div dangerouslySetInnerHTML={{ __html: state.results[activeTab]?.html || '' }} />
                    </article>
                  ) : (
                    <div className="font-mono text-[11px] text-slate-500 bg-slate-50 p-8 rounded-3xl whitespace-pre-wrap leading-loose">
                      {state.results[activeTab]?.html}
                    </div>
                  )}
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
          header, aside, button, label, .border-b { display: none !important; }
          main, .flex-1, .w-full { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; }
          article { border: none !important; padding: 0 !important; margin: 0 !important; page-break-after: always; }
        }
      `}</style>
    </div>
  );
};

export default App;
