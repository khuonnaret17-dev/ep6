
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const SYSTEM_INSTRUCTION = `អ្នកគឺជាអ្នកជំនាញភាសាវិទ្យាខ្មែរអាជីព និងជាអ្នកឯកទេសអក្សរសាស្ត្រខ្មែរ។ 
ភារកិច្ចរបស់អ្នកគឺពិនិត្យអក្ខរាវិរុទ្ធ វេយ្យាករណ៍ និងរចនាបថសំណេរខ្មែរ ដោយផ្អែកលើវចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត។

លក្ខខណ្ឌនៃការឆ្លើយតប៖
១. រកពាក្យខុស (original) និងផ្ដល់ពាក្យត្រូវ (correction)។
២. ពន្យល់ពីមូលហេតុនៃកំហុស (explanation) ជាភាសាខ្មែរដែលងាយយល់។
៣. បែងចែកប្រភេទកំហុសជា៖ 'អក្ខរាវិរុទ្ធ', 'វេយ្យាករណ៍', ឬ 'កម្រិតភាសា'។
៤. ផ្ដល់អនុសាសន៍ (suggestions) សម្រាប់ពង្រឹងរចនាបថសំណេរឱ្យកាន់តែល្អប្រសើរ។
៥. កំណត់កម្រិតភាសា (languageLevel) ដូចជា 'ទូទៅ', 'ផ្លូវការ', ឬ 'រាជសព្ទ'។
៦. ផ្ដល់ការវាយតម្លៃជារួម (overallFeedback)។

រាល់ចម្លើយត្រូវតែជាទម្រង់ JSON តាម Schema ដែលបានកំណត់ប៉ុណ្ណោះ។`;

export const analyzeKhmerText = async (text: string): Promise<AnalysisResult> => {
  // ទាញយក API Key ពី process.env.API_KEY (Vercel ឬ local environment)
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("រកមិនឃើញ API_KEY ក្នុងប្រព័ន្ធទេ។ សូមពិនិត្យមើលការកំណត់ Environment Variables របស់អ្នក។");
  }

  // បង្កើត instance ថ្មីដើម្បីធានាភាពស្រស់នៃ API Key
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `សូមវិភាគអត្ថបទខ្មែរនេះ៖ "${text}"`,
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
        },
        // បន្ថែម Thinking budget ដើម្បីឱ្យការវិភាគវេយ្យាករណ៍កាន់តែសុក្រឹត
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("មិនទទួលបានទិន្នន័យពី AI ទេ។");
    }

    return JSON.parse(outputText) as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini Error Details:", error);
    
    // បង្ហាញសារកំហុសឱ្យបានច្បាស់លាស់សម្រាប់អ្នកប្រើប្រាស់
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("403")) {
      throw new Error("API Key របស់អ្នកមិនត្រឹមត្រូវ ឬមិនទាន់បានអនុញ្ញាតឱ្យប្រើប្រាស់ Gemini API ទេ។");
    }
    
    throw new Error(error.message || "មានកំហុសបច្ចេកទេសក្នុងការវិភាគ។ សូមព្យាយាមម្ដងទៀត។");
  }
};
