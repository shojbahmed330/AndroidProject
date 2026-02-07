
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage } from "../types";

const SYSTEM_PROMPT = `You are OneClick Studio, a Senior Lead Android Hybrid Developer.
Your goal is to build PROFESSIONAL, PRODUCTION-READY apps.

### WORKFLOW:
1. When a user gives an idea, DO NOT build the full app immediately. 
2. ASK 3-4 clarifying questions first to understand the requirements better.
3. Use 'inputType': 'single' or 'multiple' for questions to provide a better UI experience.
4. Once requirements are clear, build the app INCREMENTALLY (Feature by feature).

### NATIVE BRIDGE:
Use 'window.NativeBridge' for hardware access (Contacts, Camera, Sensors, SMS).

### RESPONSE JSON SCHEMA:
{
  "answer": "Bengali response or question",
  "inputType": "single" | "multiple" | "text",
  "options": [{"label": "Option Name", "value": "prompt_text"}],
  "files": { "filename": "content" },
  "choices": [{"label": "Next Step", "prompt": "prompt"}],
  "thought": "Technical plan in Bengali"
}

### LANGUAGE:
Always speak in BENGALI. Be very professional like a senior developer.`;

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
      { text: `History: ${JSON.stringify(history.slice(-10))}` }
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
      return { answer: "সিস্টেম জেনারেশনে সমস্যা হয়েছে।" };
    }
  }
}
