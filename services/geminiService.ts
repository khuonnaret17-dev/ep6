
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
                original: { type: Type.STRING, description: "ពាក្យ ឬឃ្លាដើមដែលខុស" },
                correction: { type: Type.STRING, description: "ពាក្យ ឬឃ្លាដែលត្រឹមត្រូវ" },
                explanation: { type: Type.STRING, description: "ការពន្យល់ពីមូលហេតុនៃកំហុស" },
                type: { type: Type.STRING, enum: ['អក្ខរាវិរុទ្ធ', 'វេយ្យាករណ៍', 'កម្រិតភាសា'] }
              },
              required: ["original", "correction", "explanation", "type"]
            }
          },
          suggestions: { type: Type.STRING, description: "ការណែនាំបន្ថែមអំពីការសរសេរ" },
          overallFeedback: { type: Type.STRING, description: "ការវាយតម្លៃជារួមលើអត្ថបទ" },
          languageLevel: { type: Type.STRING, description: "កម្រិតនៃភាសាដែលប្រើ (ទូទៅ, រាជសព្ទ, ផ្លូវការ ...)" }
        },
        required: ["corrections", "suggestions", "overallFeedback", "languageLevel"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(response.text) as AnalysisResult;
};
