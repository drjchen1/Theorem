
import React from 'react';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-10 relative overflow-hidden">
        <button 
          onClick={onClose}
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

        <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
          <section>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">How it works</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black text-slate-400">01</div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Upload Files</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Upload a PDF, image (JPG, PNG, HEIC), or text file containing mathematics.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black text-slate-400">02</div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">AI Digitization</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Our AI transcribes handwriting into LaTeX and semantic HTML, preserving diagrams as accessible figures.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black text-slate-400">03</div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Export & Share</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Download the result as a standalone, WCAG 2.2 AA compliant HTML file.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="pt-6 border-t border-slate-100">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Tips for Best Results</h3>
            <div className="grid gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h5 className="text-xs font-black text-slate-900 uppercase mb-1">Lighting & Quality</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">Avoid shadows. Use dark ink on white paper. Ensure the page is as flat as possible for accurate symbol recognition.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h5 className="text-xs font-black text-slate-900 uppercase mb-1">File Size</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">For large PDFs, upload 5–10 pages at a time to ensure faster processing and better AI focus.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h5 className="text-xs font-black text-slate-900 uppercase mb-1">Spacing</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">Leave a little white space between text and diagrams. This helps the AI perfectly separate figures from paragraphs.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h5 className="text-xs font-black text-slate-900 uppercase mb-1">Refine & Recreate</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">Use "Refine Math" for complex formulas and "Magic Recreate" in the Figure Editor to turn messy sketches into clean digital diagrams.</p>
              </div>
            </div>
          </section>
        </div>

        <button 
          onClick={onClose}
          className="mt-10 w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors"
        >
          Got it, thanks!
        </button>
      </div>
    </div>
  );
};

export default HelpModal;
