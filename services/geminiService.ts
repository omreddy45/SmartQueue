import { GoogleGenAI, Type } from "@google/genai";
import { BackendService } from "./mockBackend";
import { QueueStats } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not set.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const GeminiService = {
  /**
   * Predicts wait time and provides reasoning for Students.
   */
  predictWaitTime: async (canteenId: string, queueLength: number, foodItem: string): Promise<{ estimatedMinutes: number, reasoning: string }> => {
    const client = getClient();
    
    if (!client) {
      return { estimatedMinutes: Math.max(5, queueLength * 3), reasoning: "Estimated based on queue length." };
    }

    const stats = await BackendService.getStats(canteenId);
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const timeOfDay = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const prompt = `
      You are an AI managing a university canteen queue.
      Context:
      - Queue: ${queueLength} people
      - Item: "${foodItem}"
      - Time: ${dayOfWeek}, ${timeOfDay}
      - Avg Wait: ${stats.averageWaitTime} min
      
      Task: Estimate wait time and give a 1-sentence friendly reason for the student.
      Example Reason: "It's lunch rush, so grills are busy!" or "Smoothies are quick today."
    `;

    try {
      const response = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedMinutes: { type: Type.INTEGER },
              reasoning: { type: Type.STRING }
            }
          }
        }
      });

      const json = JSON.parse(response.text || '{}');
      return {
        estimatedMinutes: json.estimatedMinutes || Math.max(5, queueLength * 3),
        reasoning: json.reasoning || "Calculating based on live traffic."
      };
    } catch (error) {
      console.error("Gemini prediction failed:", error);
      return { estimatedMinutes: Math.max(5, queueLength * 3), reasoning: "Standard estimation." };
    }
  },

  /**
   * Generates a daily insight report for Admins.
   */
  generateQueueInsights: async (stats: QueueStats): Promise<string> => {
     const client = getClient();
     if (!client) return "AI Analytics unavailable without API Key.";

     const prompt = `
        Analyze these canteen stats:
        - Total Orders: ${stats.totalOrdersToday}
        - Avg Wait: ${stats.averageWaitTime} min
        - Active Queue: ${stats.activeQueueLength}
        - Peak Hour: ${stats.peakHour}

        Provide a 3-bullet point executive summary for the canteen manager about efficiency and suggestions.
     `;

     try {
        const response = await client.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || "No insights generated.";
     } catch (e) {
         return "Failed to generate report.";
     }
  },

  /**
   * Generates high-quality food images using Gemini 3 Pro Image (Nano Banana Pro).
   */
  generateMenuImage: async (prompt: string, size: '1K' | '2K' | '4K'): Promise<string | null> => {
    // Check for user-selected API key first as required for Pro models
    if (typeof (window as any).aistudio !== 'undefined') {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if(!hasKey) {
             throw new Error("API_KEY_REQUIRED");
        }
    }

    // Always create a new client to pick up the selected key
    const client = getClient();
    if (!client) return null;

    try {
      const response = await client.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
            parts: [{ text: `Professional food photography of ${prompt}, studio lighting, 4k, delicious, isolated on simple background.` }]
        },
        config: {
          imageConfig: {
             imageSize: size,
             aspectRatio: "1:1"
          }
        }
      });
      
      // Iterate to find image part
      for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
              return `data:image/png;base64,${part.inlineData.data}`;
          }
      }
      return null;
    } catch (error) {
      console.error("Image generation failed:", error);
      throw error;
    }
  }
};