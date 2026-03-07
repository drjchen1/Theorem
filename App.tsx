
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
    incrementRequestCount
  } = useDigitization();

  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showAuditReport, setShowAuditReport] = useState(false);
  const [editingFigures, setEditingFigures] = useState<{ id: string, src: string, originalSrc: string, alt: string, pageIndex: number }[] | null>(null);

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
            --accent: #4f46e5;
            --link-color: #4338ca;
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
            padding: 2rem;
            transition: all 0.3s ease;
        }

        @media (min-width: 1024px) {
            .layout {
                display: grid;
                grid-template-columns: 200px 1fr;
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
                display: block !important;
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
            size: A4 portrait;
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

        article { 
            margin-bottom: 8rem; 
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

      <AnimatePresence>
        {editingFigures && (
          <ImageEditor 
            figures={editingFigures}
            onSave={(updates) => {
              saveEditedFigures(updates);
              setEditingFigures(null);
            }}
            onClose={() => setEditingFigures(null)}
            onApiCall={incrementRequestCount}
          />
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-[1800px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8" role="main">
        {!state.results.length && !state.isProcessing ? (
          <Dashboard 
            onFileUpload={handleFileUpload} 
            isProcessing={state.isProcessing} 
          />
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
            isRefining={isRefining}
          />
        )}
      </main>

      <div className="fixed bottom-4 right-4 text-[9px] font-black text-slate-300 uppercase tracking-widest pointer-events-none select-none z-0">
        v0.99 | {__BUILD_DATE__}
      </div>

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
          main, .flex-1, .w-full { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; margin: 0 !important; padding: 0 !important; }
          article { border: none !important; padding: 0 !important; margin: 0 !important; page-break-after: always; }
        }
      `}</style>
    </div>
  );
};

export default App;
