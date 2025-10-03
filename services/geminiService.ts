
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd handle this more gracefully, but for this context, throwing an error is fine.
  // The environment is expected to have the API key.
  console.warn("API_KEY environment variable not set. App will not function correctly.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY as string });

export async function generatePromptFromFrames(frames: string[]): Promise<string> {
  if (frames.length === 0) {
    throw new Error("No frames were provided to generate a prompt.");
  }

  const prompt = `Analyze these video frames, which are sequential snapshots from a short video clip. Generate a detailed and descriptive prompt suitable for a text-to-video AI model to recreate a similar video. The prompt should include:
- The main subject(s) and their key features.
- The primary action or movement occurring.
- The setting or environment, including background details.
- The camera angle and movement (e.g., static shot, panning left, close-up).
- The overall style, mood, or aesthetic (e.g., cinematic, hyperrealistic, 8-bit, watercolor).

Produce only the prompt text as your response.`;

  const imageParts = frames.map((frame) => ({
    inlineData: {
      mimeType: "image/jpeg",
      data: frame,
    },
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }, ...imageParts] },
    });
    return response.text;
  } catch (error) {
    console.error("Error generating prompt from Gemini:", error);
    throw new Error("Failed to communicate with the AI model. Please check the console for details.");
  }
}
