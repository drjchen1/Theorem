
/**
 * Result of the PDF processing: images for Gemini AND the original canvases for cropping.
 */
export interface PdfImageData {
  base64: string;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export const pdfToImageData = async (file: File): Promise<PdfImageData[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const data: PdfImageData[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.5 }); 
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) throw new Error('Could not create canvas context');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
    
    const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    data.push({ 
      base64, 
      canvas, 
      width: viewport.width, 
      height: viewport.height 
    });
  }

  return data;
};
