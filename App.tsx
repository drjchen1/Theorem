
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import ProcessingOverlay from './components/ProcessingOverlay';
import ImageEditor from './components/ImageEditor';
import Dashboard from './components/Dashboard';
import ResultsView from './components/ResultsView';
import AccessibilityAuditReport from './components/AccessibilityAuditReport';
import HelpModal from './components/HelpModal';
import { useDigitization } from './hooks/useDigitization';

const App: React.FC = () => {
  const {
    state,
    elapsedTime,
    originalFile,
    isRefining,
    handleFileUpload,
    handleRefineMath,
    saveEditedFigures,
    incrementUsage,
    reset
  } = useDigitization();

  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showAuditReport, setShowAuditReport] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [editingFigures, setEditingFigures] = useState<{ id: string, src: string, originalSrc: string, alt: string, pageIndex: number }[] | null>(null);

  const handleReset = () => {
    if (state.results.length > 0 && !hasDownloaded) {
      setShowResetWarning(true);
    } else {
      performReset();
    }
  };

  const performReset = () => {
    reset();
    setActiveTab(0);
    setViewMode('preview');
    setShowAuditReport(false);
    setEditingFigures(null);
    setHasDownloaded(false);
    setShowResetWarning(false);
  };

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

  const handleDownloadHtml = () => {
    const firstPageHtml = state.results[0]?.html || '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(firstPageHtml, 'text/html');
    const firstHeading = doc.querySelector('h1, h2, h3');
    const extractedTitle = firstHeading ? firstHeading.textContent?.trim() : 'Mathematics Course Notes';
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
            --bg: #fdfdfd;
            --ink: #1e293b;
            --heading-color: #0f172a;
            --accent: #CEB888;
            --link-color: #B19B69;
        }

        body { 
            font-family: 'Inter', system-ui, sans-serif; 
            background-color: var(--bg); 
            color: var(--ink); 
            margin: 0; 
            padding: 0; 
            line-height: 1.7;
            font-size: 1.125rem;
        }

        .container {
            width: 100%;
            margin: 0 auto;
            padding: 1rem;
            transition: all 0.3s ease;
        }

        @media (min-width: 1024px) {
            .container {
                padding: 2rem;
            }
            .layout {
                display: grid;
                grid-template-columns: 200px 1fr;
                gap: 2rem;
                align-items: start;
                padding-top: 4rem;
                transition: all 0.3s ease;
                max-width: 1600px;
                margin: 0 auto;
            }
            .sidebar-hidden.container {
                padding: 0;
                max-width: none;
            }
            .sidebar-hidden .layout.sidebar-hidden {
                grid-template-columns: 1fr;
                gap: 0;
                max-width: none;
                width: 100%;
                margin: 0;
            }
            .sidebar-hidden article {
                background: transparent !important;
                box-shadow: none !important;
                padding: 2rem 0 !important;
                position: relative;
                width: 100%;
            }
            .sidebar-hidden .math-content {
                max-width: 1100px;
                margin: 0 auto;
                display: block;
                padding: 5rem;
                background: #fafaf9;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                border-radius: 1.5rem;
            }
            .sidebar-hidden .download-btn-wrapper {
                position: fixed;
                right: 3rem !important;
                top: 2rem !important;
                z-index: 50;
            }
            .sidebar-hidden .page-badge {
                position: absolute;
                left: 3rem;
                top: 2rem;
                margin: 0;
                z-index: 10;
            }
            .sidebar-hidden .download-btn-wrapper a {
                background: #CEB888;
                color: #000;
                border: 2px solid #000;
                font-weight: 700;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
                transition: transform 0.2s ease;
            }
            .sidebar-hidden .download-btn-wrapper a:hover {
                transform: translateY(-2px);
                background: #e2cf9f;
            }
            .sidebar-hidden .download-btn-wrapper span {
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
            .sidebar {
                position: sticky;
                top: 4rem;
                display: block !important;
            }
            .sidebar.hidden {
                display: none !important;
            }
        }

        @page {
            size: A4 portrait;
            margin: 1cm;
        }

        .sidebar {
            display: none;
        }

        .download-btn-wrapper a {
            transition: all 0.3s ease;
        }

        @media (max-width: 1023px) {
            .download-btn-wrapper a {
                padding: 0.5rem 1rem;
                font-size: 10px;
            }
            .sidebar-hidden .math-content {
                padding: 1.5rem;
                border-radius: 0;
                grid-template-columns: 1fr;
            }
            .sidebar-hidden .download-btn-wrapper,
            .sidebar-hidden .page-badge {
                position: absolute;
                top: 0.5rem !important;
            }
            .sidebar-hidden .download-btn-wrapper {
                right: 0.5rem !important;
            }
            .sidebar-hidden .page-badge {
                left: 0.5rem !important;
            }
        }

        .toggle-sidebar-btn {
            position: fixed;
            bottom: 2rem;
            left: 2rem;
            z-index: 50;
            background: #CEB888;
            color: black;
            border: 2px solid black;
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
            background: #B19B69;
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

        article { 
            margin-bottom: 4rem; 
            position: relative; 
            width: 100%; 
            background: white;
            padding: 1.5rem;
            display: flow-root;
            box-sizing: border-box;
            transition: padding 0.3s ease;
        }

        @media (min-width: 1024px) {
            article {
                padding: 3rem;
            }
            .sidebar-hidden article {
                padding: 2rem 0;
                width: 100%;
            }
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
            border-left: 4px solid var(--accent); 
            padding: 1.5rem 2rem; 
            margin: 2.5rem 0; 
            background-color: #f8fafc; 
            font-style: italic; 
            color: #334155; 
            border-radius: 0 0.75rem 0.75rem 0;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
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
            margin: 2rem 0;
            padding: 1.5rem;
            background: #fff;
            border: 1px solid #f1f5f9;
            border-radius: 1rem;
            text-align: center;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
            max-width: 100%;
            box-sizing: border-box;
            display: block;
            overflow: hidden;
        }

        @media (min-width: 1280px) {
            .math-content {
                display: grid;
                grid-template-columns: 1fr 25%;
                gap: 0 2rem;
                align-items: start;
            }
            .math-content > * {
                grid-column: 1;
            }
            .math-content > figure {
                grid-column: 2;
                grid-row: span 50;
                margin: 0;
                width: 100%;
                max-width: none;
            }
            .math-content h1, .math-content h2, .math-content h3 {
                grid-column: 1 / -1;
                clear: both;
            }
        }

        figcaption {
            font-family: 'Inter', sans-serif;
            font-size: 0.875rem;
            color: #334155;
            margin-top: 1.5rem;
            font-style: italic;
            font-weight: 500;
            overflow-wrap: break-word;
            word-wrap: break-word;
            hyphens: auto;
        }

        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
        }

        /* Math overflow safety */
        mjx-container {
            max-width: 100% !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            padding: 0.5rem 0;
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
    <button id="sidebar-toggle" class="no-print toggle-sidebar-btn" aria-label="Toggle navigation sidebar" aria-expanded="true" aria-controls="sidebar-nav">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
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
                    <div class="no-print download-btn-wrapper" style="position: absolute; top: 0; right: 1.5rem;">
                        <a href="${originalFileName}" class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#CFB991] text-black rounded-xl font-black text-[11px] hover:bg-[#B19B69] transition-all border-2 border-black no-underline tracking-widest shadow-xl transform hover:-translate-y-0.5 active:translate-y-0" title="Download original notes">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 21v-8H7v8" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 3v5h8" />
                            </svg>
                            <span>Download original notes</span>
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
        const container = document.querySelector('.container');
        const layout = document.getElementById('main-layout');
        const sidebar = document.getElementById('sidebar-nav');
        const articles = document.querySelectorAll('.page-article');

        toggleBtn.addEventListener('click', () => {
            const isHidden = sidebar.classList.toggle('hidden');
            layout.classList.toggle('sidebar-hidden');
            container.classList.toggle('sidebar-hidden');
            toggleBtn.setAttribute('aria-expanded', !isHidden);
            
            articles.forEach(article => {
                if (isHidden) {
                    article.classList.add('content-expanded');
                } else {
                    article.classList.remove('content-expanded');
                }
            });
        });

        function checkMobile() {
            if (window.innerWidth < 1024) {
                toggleBtn.style.display = 'none';
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
    setHasDownloaded(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {(state.results.length > 0 || state.isProcessing) && (
        <Header onShowDocs={() => setShowHelp(true)} />
      )}
      
      {state.isProcessing && (
        <ProcessingOverlay 
          progress={state.progress} 
          status={state.statusMessage} 
        />
      )}

      {showAuditReport && (
        <AccessibilityAuditReport 
          results={state.results}
          activeTab={activeTab}
          state={state}
          onClose={() => setShowAuditReport(false)}
        />
      )}

      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}

      {showResetWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-100">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6 text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Unsaved Changes</h3>
            <p className="text-slate-600 mb-8 leading-relaxed">
              You haven't downloaded your digitized notes yet. Starting a new document will permanently discard your current work.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowResetWarning(false)}
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Go Back
              </button>
              <button 
                onClick={performReset}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
              >
                Discard & Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {editingFigures && (
          <ImageEditor 
            figures={editingFigures}
            onSave={(updates) => {
              saveEditedFigures(updates);
              setEditingFigures(null);
            }}
            onClose={() => setEditingFigures(null)}
            onApiCall={incrementUsage}
          />
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-[1800px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8" role="main">
        {state.error && (
          <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <h3 className="font-black text-red-900 text-sm mb-1">{state.error.split('|')[0]}</h3>
              <p className="text-red-700 text-xs leading-relaxed font-medium">{state.error.split('|')[1] || state.error}</p>
            </div>
            <button 
              onClick={() => reset()} 
              className="ml-auto p-2 text-red-400 hover:text-red-600 transition-colors"
              title="Clear Error"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        )}

        {!state.results.length && !state.isProcessing ? (
          <>
            <Dashboard 
              onFileUpload={handleFileUpload} 
              isProcessing={state.isProcessing} 
              onShowDocs={() => setShowHelp(true)}
            />
            <footer className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none select-none z-0">
              <div className="text-[9px] font-mono text-slate-400 uppercase tracking-[0.3em]">
                © 2026 KUAN-HUA CHEN // LIBERATED LOGIC // MODIFY AT WILL
              </div>
            </footer>
          </>
        ) : (
          <ResultsView 
            results={state.results}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onEditFigure={handleEditFigure}
            onBatchEdit={handleBatchEdit}
            onRefineMath={() => handleRefineMath(activeTab)}
            onDownloadHtml={handleDownloadHtml}
            onShowAudit={() => setShowAuditReport(true)}
            onReset={handleReset}
            isRefining={isRefining}
          />
        )}
      </main>

      <style>{`
        .notebox {
          border-left: 4px solid #CEB888;
          padding: 1.5rem 2rem;
          margin: 2.5rem 0;
          background-color: #f8fafc;
          border-radius: 0 0.75rem 0.75rem 0;
          font-style: italic;
          color: #334155;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }
        @media (min-width: 1400px) {
          .math-content {
            display: grid;
            grid-template-columns: 1fr 350px;
            gap: 0 4rem;
            align-items: start;
          }
          .math-content > * {
            grid-column: 1;
          }
          .math-content > figure {
            grid-column: 2;
            grid-row: span 20;
            margin: 0;
            width: 100%;
            max-width: none;
          }
          .math-content h1, .math-content h2, .math-content h3 {
            grid-column: 1 / -1;
            clear: both;
          }
          .grid-layout {
            display: grid;
            grid-template-columns: 1fr 350px;
            gap: 0 4rem;
            align-items: start;
          }
          .grid-layout > *:not(figure) {
            grid-column: 1;
          }
          .grid-layout > figure {
            grid-column: 2;
            margin: 0;
            width: 100%;
            max-width: none;
          }
        }
        @media print {
          header, aside, button, label, .border-b { display: none !important; }
          main, .flex-1, .w-full { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; margin: 0 !important; padding: 0 !important; }
          article { border: none !important; padding: 0 !important; margin: 0 !important; page-break-after: always; }
        }
      `}</style>
    </div>
  );
};

export default App;
