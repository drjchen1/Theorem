
import React from 'react';

interface HeaderProps {
  onShowDocs: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowDocs }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Q.E.D.</h1>
        </div>
        
        <nav className="hidden sm:flex gap-6 text-sm font-medium text-slate-600">
          <button onClick={onShowDocs} className="hover:text-indigo-600 transition-colors">Documentation</button>
          <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">Accessibility Standards</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
