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
  // Accessing API KEY from environment directly for Vercel compatibility
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }

  if (!text.trim()) {
    throw new Error("EMPTY_TEXT");
  }

  // Use the recommended model for text processing
  const modelName = 'gemini-3-flash-preview';
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{
        parts: [{
          text: `សូមពិនិត្យអក្ខរាវិរុទ្ធ និងវេយ្យាករណ៍ភាសាខ្មែរសម្រាប់អត្ថបទខាងក្រោម៖
          
          អត្ថបទ៖ "${text}"`
        }]
      }],
      config: {
        systemInstruction: "You are a senior Khmer language expert and editor. Provide precise spelling and grammar corrections. Ensure the response matches the JSON schema exactly. Explanations must be in Khmer.",
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
      },
    });

    const jsonStr = response.text?.trim() || "{}";
    const result = JSON.parse(jsonStr);
    return result as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.status === 401 || error.status === 403 || error.message?.includes('API key')) {
      throw new Error("INVALID_API_KEY");
    }
    throw new Error("API_FAILURE");
  }
};