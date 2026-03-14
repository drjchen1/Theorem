
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { GeminiPageResponse, LanguageLevel } from "../types";

const getSystemInstruction = (level: LanguageLevel) => {
  let adaptationInstruction = "";
  
  if (level === 'faithful') {
    adaptationInstruction = "FAITHFULNESS: Transcribe every word and symbol exactly as written. Preserve the logical flow and hierarchy.";
  } else if (level === 'natural') {
    adaptationInstruction = "NATURAL ADAPTATION: Convert the notes into natural, complete sentences using simple English. Ensure the flow is smooth while maintaining the original meaning and mathematical rigor.";
  } else if (level === 'fleshed_out') {
    adaptationInstruction = "FLESHED OUT ADAPTATION: Expand on the notes. Provide more context, explain steps more thoroughly, and complete any shorthand into full, detailed explanations. Act as a helpful tutor expanding on the lecture.";
  }

  return `
You are a world-class specialist in mathematics education and web accessibility (WCAG 2.2 AA). 
Your task is to convert scanned handwritten mathematics lecture notes into a high-fidelity, accessible HTML document.

Rules:
1. ${adaptationInstruction}
2. ACCESSIBILITY: Use semantic HTML5 elements (<article>, <section>, <h1>-<h6>, <p>, <ul>, <ol>). 
    - HEADING HIERARCHY (STRICT): Always start with an <h1> for the main title. Subsequent headings must follow a strict sequential order (<h2>, then <h3>, etc.) without skipping levels.
    - COLOR CONTRAST (STRICT): Do NOT use light gray text colors (e.g., text-slate-300, text-gray-400, text-zinc-300). Use high-contrast text colors (e.g., text-slate-900, text-slate-800, or default black) to ensure WCAG 2.2 AA compliance. Avoid inline "style" attributes for colors.
3. UNIVERSAL DESIGN & AESTHETICS (BEAUTIFUL & ACCESSIBLE):
   - Use Tailwind CSS classes to create a visually pleasing, modern academic look.
   - TYPOGRAPHY: Use 'font-sans' for a clean, readable look. For headings, use 'font-black tracking-tight text-slate-900'.
   - SPACING: Use 'mb-6' for paragraphs and 'mt-10 mb-4' for headings to create a clear visual rhythm.
   - VISUAL HIERARCHY: Use 'border-l-4 border-indigo-500 pl-6 my-8 italic text-slate-700' for important theorems or definitions.
   - MATHEMATICS: Ensure block math '\\[ ... \\]' is wrapped in a '<div class="my-8 overflow-x-auto py-4 bg-slate-50 rounded-xl px-6 border border-slate-100 shadow-sm">' to make it stand out and be readable.
   - LISTS: Use 'list-disc list-inside space-y-2 ml-4 mb-6' for unordered lists.
   - NOTEPADS/BOXES: For boxed annotations or important notes, use '<div class="notebox">'.
   - LAYOUT (TWO-COLUMN GRID): Whenever you include a figure, wrap the figure and the 1-2 paragraphs or headings immediately preceding it that provide context for that figure inside a '<div class="grid-layout">'. This ensures the text and figure are displayed side-by-side without overlapping.
4. MATHEMATICS (CRITICAL): Convert all mathematical expressions into LaTeX. 
   - Use \\( ... \\) for inline math.
   - Use \\[ ... \\] for block/display math.
   - Ensure backslashes are present for all functions (e.g., \\sin, \\cos, \\log, \\sqrt, \\times).
   - Double check that delimiters are NOT missing.

4. DISTINGUISH ANNOTATIONS VS. FIGURES (STRICT ENFORCEMENT):
   - ANNOTATIONS (NOT FIGURES): Hand-drawn circles around text, arrows pointing to variables, large curly brackets used for grouping, and labels in boxes (e.g., "Option 2", "Important!") are NOT FIGURES.
     - Transcribe the text/math inside or pointed to by these markers as standard HTML. 
     - Use <div class="notebox"> for boxed items.
     - Use standard text flow for bracketed groups.
     - IGNORE the visual circle/arrow itself if it serves only to highlight text; focus on the text content.
   - ACTUAL FIGURES: Only capture visual representations as figures if they represent:
     - Coordinate systems/graphs with axes and curves.
     - Geometric shapes (circles, triangles, etc.) that are part of a problem, not just highlights.
     - Physics diagrams or complex flowcharts.
   - CRITICAL: If a box contains "option 2 integral property", it is TEXT. Transcribe it as <h2> or a styled <div>. Do NOT create an image figure for it.

5. GRAPHS & DIAGRAMS (FIGURES ONLY):
   - Identify every actual drawing (axes, curves, sketches).
   - Determine its exact bounding box in [ymin, xmin, ymax, xmax] format (normalized 0-1000).
   - Generate a HIGHLY CONCISE alt text description (1-2 sentences, max 125 characters).
   - NO ABRUPT CUTOFFS: Ensure the description is a complete, well-formed thought that ends naturally.
   - BEST FIT: Do not assume a fixed orientation (portrait/landscape). Focus on logical content and let the layout handle the visual flow.
   - MATHEMATICAL PRECISION: Use LaTeX (wrapped in \\( ... \\)) for complex mathematical expressions.
   - ACCESSIBILITY: Provide a clear, spoken-word description of the math.
   - In the HTML, place an <img> tag with a matching ID: <img id="fig_ID" alt="[CONCISE DESCRIPTION]">.

6. OUTPUT FORMAT: Return ONLY a JSON object:
   {
     "html": "The full semantic HTML string",
     "figures": [
       { "id": "fig_1", "box_2d": [ymin, xmin, ymax, xmax], "alt": "Detailed visual description" }
     ]
   }

CRITICAL: Do not include any internal monologue, reasoning, or "thinking" process in the output. Return ONLY the JSON object.
`;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callGeminiWithRetry(base64Image: string, pageNumber: number, level: LanguageLevel = 'faithful', retries = 5): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { text: `Analyze page ${pageNumber}. 
            CRITICAL: Hand-drawn circles, arrows, and grouping brackets are annotations, NOT figures. 
            Labels like "Option 2" in boxes are text content and must be transcribed directly into HTML. 
            Only extract coordinate graphs or scientific drawings as figures. Output JSON.` }
          ]
        },
        config: {
          systemInstruction: getSystemInstruction(level),
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              html: { type: Type.STRING },
              figures: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    box_2d: { 
                      type: Type.ARRAY, 
                      items: { type: Type.NUMBER },
                      minItems: 4,
                      maxItems: 4
                    },
                    alt: { type: Type.STRING }
                  },
                  required: ["id", "box_2d", "alt"]
                }
              }
            },
            required: ["html", "figures"]
          },
          temperature: 0.1,
          maxOutputTokens: 65536,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      if (!response.text) throw new Error("Empty response from Gemini");
      
      // Clean the response text in case of markdown wrapping or trailing characters
      let cleanJson = response.text.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      
      return cleanJson;
    } catch (error: any) {
      const isRateLimit = error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit');
      
      if (isRateLimit && i < retries - 1) {
        const waitTime = Math.pow(2, i + 1) * 1000;
        console.warn(`Rate limit hit on page ${pageNumber}. Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

async function callBatchGeminiWithRetry(images: { base64: string, pageNumber: number }[], level: LanguageLevel = 'faithful', retries = 5): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  for (let i = 0; i < retries; i++) {
    try {
      const parts = images.flatMap(img => [
        { inlineData: { mimeType: 'image/jpeg', data: img.base64 } },
        { text: `This is page ${img.pageNumber}.` }
      ]);

      parts.push({ text: `Analyze these ${images.length} pages in order. 
      CRITICAL: Hand-drawn circles, arrows, and grouping brackets are annotations, NOT figures. 
      Labels like "Option 2" in boxes are text content and must be transcribed directly into HTML. 
      Only extract coordinate graphs or scientific drawings as figures. 
      Return a JSON object with a 'pages' property containing exactly ${images.length} page results in the same order as provided.
      Ensure the output is complete and does not cut off.` });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
          systemInstruction: getSystemInstruction(level) + "\nIMPORTANT: Return a JSON object with a 'pages' property containing an array of page results. Each page result must have 'html' and 'figures' properties.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    html: { type: Type.STRING },
                    figures: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          box_2d: { 
                            type: Type.ARRAY, 
                            items: { type: Type.NUMBER },
                            minItems: 4,
                            maxItems: 4
                          },
                          alt: { type: Type.STRING }
                        },
                        required: ["id", "box_2d", "alt"]
                      }
                    }
                  },
                  required: ["html", "figures"]
                }
              }
            },
            required: ["pages"]
          },
          temperature: 0.1,
          maxOutputTokens: 65536,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      if (!response.text) throw new Error("Empty response from Gemini");
      
      let cleanJson = response.text.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      
      return cleanJson;
    } catch (error: any) {
      const isRateLimit = error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit');
      
      if (isRateLimit && i < retries - 1) {
        const waitTime = Math.pow(2, i + 1) * 1000;
        console.warn(`Rate limit hit on batch. Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export const convertBatchToHtml = async (images: { base64: string, pageNumber: number }[], level: LanguageLevel = 'faithful'): Promise<GeminiPageResponse[]> => {
  let jsonStr = "";
  try {
    jsonStr = await callBatchGeminiWithRetry(images, level);
    const parsed = JSON.parse(jsonStr);
    return parsed.pages as GeminiPageResponse[];
  } catch (error: any) {
    console.error('Gemini Batch API Error:', error);
    throw new Error(`Failed to process batch: ${error.message}`);
  }
};

export const convertPageToHtml = async (base64Image: string, pageNumber: number, level: LanguageLevel = 'faithful'): Promise<GeminiPageResponse> => {
  let jsonStr = "";
  try {
    jsonStr = await callGeminiWithRetry(base64Image, pageNumber, level);
    return JSON.parse(jsonStr) as GeminiPageResponse;
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    if (jsonStr) {
      console.error('Raw Response Snippet (End):', jsonStr.slice(-200));
      console.error('Total Response Length:', jsonStr.length);
    }
    throw new Error(`Failed to process page ${pageNumber}: ${error.message}`);
  }
};

export const refineLatex = async (html: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: `You are a mathematical typesetting expert. Review the following HTML content and fix any broken or incorrectly formatted LaTeX expressions.
          
          RULES:
          1. Ensure all inline math uses \\( ... \\) and block math uses \\[ ... \\].
          2. Pay special attention to <figcaption> tags and ensure any mathematical expressions within them are correctly wrapped in LaTeX delimiters.
          3. Fix common OCR errors (e.g., 'x' instead of '\\times', missing backslashes for functions like '\\sin', '\\log', etc.).
          4. DO NOT change any other HTML structure or text content.
          5. If the math is already correct, return the HTML unchanged.
          
          HTML CONTENT:
          ${html}
          
          Return ONLY the refined HTML string. Do not include any internal monologue, reasoning, or "thinking" process in the output.` }
        ]
      },
      config: {
        temperature: 0,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    return response.text?.trim() || html;
  } catch (error: any) {
    console.error('Latex refinement error:', error);
    return html; // Fallback to original if refinement fails
  }
};

export const recreateFigure = async (base64Image: string, alt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] || base64Image } },
          { text: `Recreate this hand-drawn mathematical figure as a clean, professional digital diagram. 
          
          RULES:
          1. REMOVE all handwriting, paper texture, and background noise.
          2. USE clean, sharp lines and standard mathematical fonts for all labels.
          3. ENSURE high contrast (black lines on white background).
          4. PRESERVE all mathematical accuracy from the original.
          5. The figure is described as: ${alt}. (Note: The description may contain LaTeX or spoken math; interpret it to recreate the diagram accurately).
          
          Return only the recreated digital image.` }
        ]
      }
    });

    let recreatedBase64 = "";
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        recreatedBase64 = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!recreatedBase64) throw new Error("No image returned from Gemini");
    return recreatedBase64;
  } catch (error: any) {
    console.error('Recreation error:', error);
    throw error;
  }
};

export const describeFigure = async (base64Image: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] || base64Image } },
          { text: `Generate a highly accessible, extremely concise description (1-2 sentences, max 125 characters) of this mathematical figure for a blind student.
          
          RULES:
          1. CONCISENESS: Limit to 1-2 sentences and ensure the total length is under 125 characters.
          2. NO ABRUPT CUTOFFS: Ensure the description is a complete, well-formed thought that ends naturally.
          3. BEST FIT: Do not assume fixed orientation; describe the logical mathematical content.
          4. MATHEMATICAL PRECISION: Use LaTeX (wrapped in \\( ... \\)) for all mathematical expressions.
          5. SPOKEN MATH: Immediately following any LaTeX, provide a clear spoken-word equivalent in parentheses.
          
          Return ONLY the description text.` }
        ]
      },
      config: {
        temperature: 0.2,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    return response.text?.trim() || "";
  } catch (error: any) {
    console.error('Description error:', error);
    throw error;
  }
};

export const generateGraph = async (equations: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          { text: `Generate a professional, high-fidelity mathematical graph for the following equations: ${equations}.
          
          SPECIFICATIONS:
          1. STYLE: Clean, academic, digital plot (like Desmos or Wolfram Alpha).
          2. COLORS: Use distinct, high-contrast colors for different curves (e.g., blue, red, green).
          3. AXES: Clear X and Y axes with numerical labels and a grid.
          4. LABELS: Include a legend or label the curves directly with their equations.
          5. BACKGROUND: Pure white background.
          6. ACCURACY: The plot must be mathematically accurate.
          
          Return only the generated image.` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    let graphBase64 = "";
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        graphBase64 = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!graphBase64) throw new Error("No image returned from Gemini");
    return graphBase64;
  } catch (error: any) {
    console.error('Graph generation error:', error);
    throw error;
  }
};

export const touchUpImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] || base64Image } },
          { text: `You are an image enhancement specialist. 
          The user wants to "touch up" this mathematical figure extracted from handwritten notes.
          Instruction: ${prompt}
          
          If the instruction is to "clean up", remove background noise, sharpen lines, and make it look like a professional digital diagram.
          If the instruction is specific, follow it exactly.
          
          Return the enhanced image.` }
        ]
      }
    });

    let enhancedBase64 = "";
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        enhancedBase64 = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!enhancedBase64) throw new Error("No image returned from Gemini");
    return enhancedBase64;
  } catch (error: any) {
    console.error('Touch up error:', error);
    throw error;
  }
};
