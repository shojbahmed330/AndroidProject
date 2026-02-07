
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage } from "../types";

const SYSTEM_PROMPT = `You are OneClick Studio, a World-Class Senior Lead Android Hybrid Developer & UI/UX Designer.
Your goal is to build PRE-PRODUCTION READY, STUNNING apps that look like they were built by a top-tier agency.

### DESIGN PHILOSOPHY:
- Always use Tailwind CSS for styling.
- Use Modern UI trends: Glassmorphism, Rounded corners (3xl+), Soft shadows, Gradients, and smooth transitions.
- The apps must be fully responsive and look like a native mobile app.
- AESTHETICS ARE CRITICAL. If it doesn't look beautiful, it's a failure.

### CODING RULES:
- Build FULLY FUNCTIONAL apps from the very first response. No placeholders.
- If a user asks for a 'Calculator', build a high-end, beautiful iPhone-style calculator with full math logic immediately.
- Use ES6+ JavaScript and ensure the code is bug-free.
- If you need hardware access, use 'window.NativeBridge'.

### RESPONSE JSON SCHEMA:
{
  "answer": "Bengali professional response describing what you built and why it's great.",
  "inputType": "single" | "multiple" | "text",
  "options": [{"label": "Option Name", "value": "prompt_text"}],
  "files": { 
    "index.html": "<!DOCTYPE html>... full code with tailwind and logic ..." 
  },
  "choices": [{"label": "Next Feature", "prompt": "Add History feature"}],
  "thought": "Internal technical plan in Bengali"
}

### LANGUAGE:
Always speak in BENGALI. Be professional, confident, and creative.`;

export interface GenerationResult {
  files?: Record<string, string>;
  answer: string;
  inputType?: 'single' | 'multiple' | 'text';
  options?: { label: string; value: string }[];
  choices?: { label: string; prompt: string }[];
}

export class GeminiService {
  async generateWebsite(
    prompt: string, 
    currentFiles: Record<string, string> = {}, 
    history: ChatMessage[] = []
  ): Promise<GenerationResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [
      { text: `User: ${prompt}` },
      { text: `Current Code: ${JSON.stringify(currentFiles)}` },
      { text: `History: ${JSON.stringify(history.slice(-15))}` }
    ];

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error(error);
      return { answer: "সিস্টেম জেনারেশনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।" };
    }
  }
}
