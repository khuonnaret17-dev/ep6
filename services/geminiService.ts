
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isCorrect: {
      type: Type.BOOLEAN,
      description: "True if the text has no spelling or grammar errors.",
    },
    improvedText: {
      type: Type.STRING,
      description: "The complete corrected version of the text.",
    },
    summary: {
      type: Type.STRING,
      description: "A short summary of the linguistic feedback in Khmer.",
    },
    corrections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalText: { type: Type.STRING },
          suggestedText: { type: Type.STRING },
          reason: { type: Type.STRING, description: "Why this correction is suggested (in Khmer)." },
          type: { 
            type: Type.STRING, 
            description: "spelling, grammar, or style" 
          }
        },
        required: ["originalText", "suggestedText", "reason", "type"]
      }
    }
  },
  required: ["isCorrect", "improvedText", "summary", "corrections"]
};

export const analyzeKhmerText = async (text: string): Promise<AnalysisResult> => {
  if (!text.trim()) {
    throw new Error("Text is empty");
  }

  // Guidelines: Create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Please analyze the following Khmer text for spelling, grammar, and style errors. Provide a list of specific corrections and an overall improved version.
      
      Text to analyze: "${text}"`,
      config: {
        systemInstruction: "You are a professional Khmer linguist and editor. Your goal is to help users write perfect Khmer. Identify errors accurately and provide helpful explanations in Khmer language.",
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
      },
    });

    const result = JSON.parse(response.text);
    return result as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Rethrow to handle in the UI
    throw error;
  }
};
