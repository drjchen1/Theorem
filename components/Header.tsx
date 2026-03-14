
import React from 'react';

interface HeaderProps {
  onShowDocs: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowDocs }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-[1800px] mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-slate-900 text-[#CFB991] w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl md:rounded-2xl shadow-lg shadow-slate-200 flex-shrink-0">
            <span className="text-xl md:text-2xl font-serif italic font-bold leading-none select-none transform -translate-y-0.5">Q</span>
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-base md:text-2xl font-black text-slate-900 tracking-tighter truncate md:whitespace-normal pr-2">
              Q.E.D. <span className="font-bold md:font-black text-slate-500 md:text-slate-900">&nbsp; (Quod Erat <span className="italic font-black text-[#CFB991] pr-1">Digitandum</span>)</span>
            </h1>
            <div className="flex items-center gap-1.5 -mt-0.5 md:-mt-1">
              <span className="text-[6px] md:text-[7px] font-black text-slate-400 uppercase tracking-widest">As Seen on</span>
              <a 
                href="https://sites.google.com/view/chenflix/home" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[8px] md:text-[10px] font-black text-[#E50914] tracking-tighter transform scale-y-110 inline-block drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)] hover:opacity-80 transition-opacity"
              >
                CHENFLIX
              </a>
            </div>
          </div>
        </div>
        
        <nav className="hidden sm:flex items-center gap-4 md:gap-8 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest flex-shrink-0">
          <button onClick={onShowDocs} className="hover:text-indigo-600 transition-colors">Documentation</button>
          <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">WCAG 2.2 AA</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
