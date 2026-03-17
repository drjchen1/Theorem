
export type LanguageLevel = 'faithful' | 'natural' | 'fleshed_out';

export interface Figure {
  id: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  alt: string;
}

export interface GeminiPageResponse {
  html: string;
  figures: Figure[];
}

export interface BatchResponse {
  pages: GeminiPageResponse[];
  tokenCount: number;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export interface AccessibilityAudit {
  score: number;
  checks: {
    title: string;
    passed: boolean;
    description: string;
    suggestion?: string;
  }[];
}

export interface FigureResult {
  id: string;
  originalSrc: string;
  currentSrc: string;
  alt: string;
}

export interface ConversionResult {
  html: string;
  pageNumber: number;
  width: number;
  height: number;
  audit?: AccessibilityAudit;
  figures: FigureResult[];
}

export interface AppState {
  isProcessing: boolean;
  progress: number;
  results: ConversionResult[];
  error: string | null;
  statusMessage: string;
  totalTime?: number;
  sessionRequestCount: number;
  dailyRequestCount: number;
}

declare global {
  const __BUILD_DATE__: string;
  interface Window {
    MathJax: {
      typesetPromise: (elements: any[]) => Promise<void>;
    };
    pdfjsLib: any;
  }
}
