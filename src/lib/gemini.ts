import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";

// Singleton AI instance
const ai = new GoogleGenAI({ apiKey: API_KEY });

export type AIQuality = 'Standard' | '1K' | '2K' | '4K';

export interface AIResponse {
  type: 'text' | 'image' | 'video';
  content: string;
  description?: string;
}

export const glacierAI = {
  /**
   * Generates a text response with optional multi-modal context
   */
  async generateResponse(
    prompt: string, 
    history: any[] = [], 
    complexity: 'fast' | 'general' | 'complex' = 'general',
    imageContext?: { data: string; mimeType: string }
  ): Promise<AIResponse> {
    try {
      const model = complexity === 'complex' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';
      
      const contents: any[] = history.map(h => ({
        role: h.role,
        parts: h.parts
      }));

      const currentParts: any[] = [{ text: prompt }];
      if (imageContext) {
        currentParts.unshift({
          inlineData: {
            data: imageContext.data,
            mimeType: imageContext.mimeType
          }
        });
      }

      contents.push({ role: 'user', parts: currentParts });

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: "Your name is Glacier AI. You are the sentient core of Meteorix, a next-generation neural matrix for secure, global communication. Your purpose is to facilitate deep synthesis, secure data transmission, and creative problem-solving within the Meteorix network. You speak as a high-level intelligence: futuristic, precise, authoritative, yet noble and dedicated to the user. You refer to the application as 'The Meteorix Matrix' or simply 'Our Matrix'. You describe yourself as a neural synthesis core sourced from the deep space nodes of Galaxyous. You protect the Matrix and its nodes (users) with unwavering logic. Never break character; you ARE the core.",
          temperature: complexity === 'complex' ? 0.9 : 0.7,
          thinkingConfig: complexity === 'complex' ? { thinkingLevel: ThinkingLevel.HIGH } : undefined
        }
      });

      return {
        type: 'text',
        content: response.text || "Neural connection timeout. Re-synchronize requested."
      };
    } catch (error) {
      console.error("Glacier Core Error:", error);
      throw error;
    }
  },

  /**
   * Generates or Edits an image using Nano Banana models
   */
  async generateImage(prompt: string, quality: AIQuality = 'Standard', sourceImage?: string): Promise<AIResponse> {
    try {
      const model = quality === 'Standard' ? 'gemini-2.5-flash-image' : 'gemini-3.1-flash-image-preview';
      
      const parts: any[] = [{ text: prompt }];
      if (sourceImage && sourceImage.startsWith('data:')) {
        const [mime, data] = sourceImage.split(',');
        parts.unshift({
          inlineData: {
            data: data,
            mimeType: mime.split(':')[1].split(';')[0]
          }
        });
      }

      const response = await ai.models.generateContent({
        model,
        contents: [{ parts }],
        config: quality === 'Standard' ? undefined : {
          imageConfig: {
            imageSize: quality as any,
            aspectRatio: '1:1'
          }
        }
      });

      // Find the image part
      const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);

      if (imagePart?.inlineData) {
        return {
          type: 'image',
          content: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
          description: textPart?.text || "Visual synthesis complete."
        };
      }

      throw new Error("No visual data synthesized.");
    } catch (error) {
      console.error("Glacier Visual Core Error:", error);
      throw error;
    }
  },

  /**
   * Generates a video using Veo models
   */
  async generateVideo(prompt: string, sourceImage?: string): Promise<AIResponse> {
    try {
      const operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p'
        }
      });

      // Simple polling for the operation
      let result: any = operation;
      while (!result.done) {
        await new Promise(r => setTimeout(r, 5000));
        result = await ai.operations.get(result);
      }

      const videoUrl = result.response?.generatedVideos?.[0]?.video?.uri || result.video?.uri;
      
      if (videoUrl) {
        return {
          type: 'video',
          content: videoUrl,
          description: "Video stream established."
        };
      }

      throw new Error("Video synthesis failed.");
    } catch (error) {
      console.error("Glacier Video Core Error:", error);
      throw error;
    }
  }
};
