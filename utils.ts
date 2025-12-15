import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import * as pdfjs from 'pdfjs-dist';

// Fix for pdfjs-dist import via esm.sh
const pdfjsLib = (pdfjs as any).default || pdfjs;

if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        }
        
        return fullText;
    } catch (error) {
        console.error("PDF Extraction failed:", error);
        throw new Error("Failed to extract text from PDF. Ensure the file is not corrupted.");
    }
};

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Robustly parses JSON from a string that might contain extra text (e.g. Markdown).
 * Scans for the outermost {} pair that forms valid JSON.
 */
export function parseJsonFromText(text: string): any {
    if (!text) return null;
    
    // 1. Try cleaning markdown code blocks first
    let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // 2. Try direct parse
    try {
        return JSON.parse(clean);
    } catch (e) {
        // Continue to extraction logic
    }

    // 3. Extract using brace counting
    let start = clean.indexOf('{');
    if (start === -1) return null;

    let braceCount = 0;
    let end = -1;

    for (let i = start; i < clean.length; i++) {
        if (clean[i] === '{') braceCount++;
        else if (clean[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
                end = i;
                // Try parsing the substring found so far. 
                try {
                    const candidate = clean.substring(start, end + 1);
                    return JSON.parse(candidate);
                } catch(e) {
                    // parsing failed
                }
                break;
            }
        }
    }
    
    return null;
}