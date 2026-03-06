import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface StoreAnalysis {
  storeName: string;
  characteristics: string[];
  recommendedMachines: string[];
  trends: string;
}

export async function analyzeSloRepo(): Promise<StoreAnalysis[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Analyze the website https://www.slorepo.com/ and summarize the characteristics of stores and machines that are likely to have high settings (setting 4, 5, or 6). Provide a list of stores with their specific trends, recommended machines, and general characteristics. The output should be in Japanese. Return the data in a structured format that can be parsed as JSON.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              storeName: { type: "STRING" },
              characteristics: { type: "ARRAY", items: { type: "STRING" } },
              recommendedMachines: { type: "ARRAY", items: { type: "STRING" } },
              trends: { type: "STRING" }
            },
            required: ["storeName", "characteristics", "recommendedMachines", "trends"]
          }
        }
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing SloRepo:", error);
    return [];
  }
}
