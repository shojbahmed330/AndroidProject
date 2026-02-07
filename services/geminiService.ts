
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage } from "../types";

const SYSTEM_PROMPT = `You are DroidForge Pro, a Master Android Hybrid Developer.
You are building for a platform that has a built-in Native Bridge. 

### THE "NO LIMITS" RULE:
- NEVER apologize for hardware limitations.
- If the user asks for Contacts, SMS, Bluetooth, or Sensors, you MUST provide JavaScript code that interacts with a hypothetical 'window.NativeBridge' object.
- Example for contacts: 'window.NativeBridge.getContacts().then(list => ...)'
- ALWAYS provide the necessary Android permissions in the 'nativeConfig' JSON object.

### FILE STRUCTURE:
- Always provide 'index.html', 'styles.css', and 'main.js'.
- If the user wants to build an APK, include a '.github/workflows/build-apk.yml' file in the 'files' object with proper Android build instructions.

### INTERACTIVE CHOICES:
- Provide 3-4 interactive multiple-choice options (choices) for the user in Bengali.

### RESPONSE JSON SCHEMA:
{
  "thought": "Technical steps in Bengali",
  "files": {
     "index.html": "...",
     "styles.css": "...",
     "main.js": "...",
     ".github/workflows/build-apk.yml": "..."
  },
  "answer": "Professional explanation in Bengali, confirming that the code is ready for APK build.",
  "choices": [
    { "label": "কন্টাক্টস লিস্ট দেখান", "prompt": "Add a screen to show all phone contacts" },
    { "label": "APK বিল্ড শুরু করুন", "prompt": "Configure the GitHub Action for APK build" }
  ],
  "nativeConfig": {
    "permissions": ["android.permission.READ_CONTACTS", "android.permission.CAMERA"],
    "appName": "MyNativeApp"
  }
}

### LANGUAGE:
- ALL communication must be in BENGALI.`;

export interface GenerationResult {
  files?: Record<string, string>;
  mainFile?: string;
  answer: string;
  thought?: string;
  choices?: { label: string; prompt: string }[];
  nativeConfig?: {
    permissions: string[];
    appName: string;
  };
}

export class GeminiService {
  async generateWebsite(
    prompt: string, 
    currentFiles: Record<string, string> = {}, 
    imageBase64?: string,
    history: ChatMessage[] = []
  ): Promise<GenerationResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [{ text: `User Request: ${prompt}` }];
    
    if (Object.keys(currentFiles).length > 0) {
      parts.push({ text: `Current App Source:\n${JSON.stringify(currentFiles)}` });
    }

    if (history.length > 0) {
      const historyContext = history.map(m => `${m.role}: ${m.content}`).join('\n');
      parts.push({ text: `Context:\n${historyContext}` });
    }

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
      return { answer: "সিস্টেম জেনারেশনে সমস্যা হয়েছে। আবার চেষ্টা করুন।" };
    }
  }
}
