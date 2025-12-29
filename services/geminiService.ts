
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const SYSTEM_INSTRUCTION = `អ្នកគឺជាអ្នកជំនាញភាសាវិទ្យាខ្មែរអាជីព ដែលមានចំណេះដឹងជ្រៅជ្រះលើវចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត និងវិធានវេយ្យាករណ៍ខ្មែរទំនើប។ 
ភារកិច្ចរបស់អ្នកគឺ៖
១. ពិនិត្យអក្ខរាវិរុទ្ធ (Spelling) និងវេយ្យាករណ៍ (Grammar) ក្នុងអត្ថបទដែលអ្នកប្រើប្រាស់ផ្ដល់ឱ្យ។
២. កំណត់ពាក្យដែលសរសេរខុស ហើយផ្ដល់ពាក្យត្រឹមត្រូវជំនួសវិញ។
៣. ពន្យល់ពីមូលហេតុនៃកំហុសជាភាសាខ្មែរឱ្យបានច្បាស់លាស់ និងសាមញ្ញ។
៤. ផ្ដល់ការណែនាំបន្ថែមអំពីរបៀបសរសេរ ឃ្លា ប្រយោគ ឬកម្រិតភាសា (រាជសព្ទ ឬពាក្យទូទៅ) ឱ្យសមស្របតាមបរិបទ។
៥. រាល់ចម្លើយត្រូវផ្ដល់មកវិញជាទម្រង់ JSON structure តែប៉ុណ្ណោះ។`;

export const analyzeKhmerText = async (text: string): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY មិនត្រូវបានរកឃើញក្នុង Environment Variables ទេ។ សូមកំណត់វាជាមុនសិន។");
  }

  // បង្កើត instance ថ្មីរាល់ពេលហៅ ដើម្បីធានាភាពត្រឹមត្រូវនៃ key
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // ប្តូរមក Pro Preview ដើម្បីសមត្ថភាពខ្ពស់ជាងមុន
      contents: `សូមពិនិត្យអត្ថបទនេះ៖ "${text}"`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            corrections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  correction: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['អក្ខរាវិរុទ្ធ', 'វេយ្យាករណ៍', 'កម្រិតភាសា'] }
                },
                required: ["original", "correction", "explanation", "type"]
              }
            },
            suggestions: { type: Type.STRING },
            overallFeedback: { type: Type.STRING },
            languageLevel: { type: Type.STRING }
          },
          required: ["corrections", "suggestions", "overallFeedback", "languageLevel"]
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("ប្រព័ន្ធមិនបានផ្ដល់ចម្លើយមកវិញទេ។");
    }

    return JSON.parse(outputText) as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("403")) {
      throw new Error("API Key របស់អ្នកមិនទាន់បានបើកដំណើរការ Generative Language API ឬមានបញ្ហាកំណត់សិទ្ធិ។");
    }
    if (error.message?.includes("404")) {
      throw new Error("មិនអាចរកឃើញ Model 'gemini-3-pro-preview' ទេ។");
    }
    throw error;
  }
};
