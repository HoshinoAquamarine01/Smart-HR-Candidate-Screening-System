import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { CV_EXTRACTION_GEMINI_SCHEMA } from '../schemas/cv-extraction.schema';
import { CV_SYSTEM_PROMPT } from '../prompts/cv-extraction.prompt';
import { StandardCvProfile } from '../interfaces/standard-cv.interface';
import { AiExtractionResult, IAiProvider } from '../interfaces/ai-provider.interface';

@Injectable()
export class GeminiProvider implements IAiProvider {
  readonly name = 'Google Gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private client: GoogleGenAI | null = null;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('geminiApiKey') ||
      this.configService.get<string>('GEMINI_API_KEY') ||
      process.env.GEMINI_API_KEY;
    this.modelName =
      this.configService.get<string>('geminiModel') ||
      process.env.GEMINI_MODEL ||
      'gemini-2.0-flash';

    if (apiKey && apiKey.trim() !== '' && apiKey !== 'dummy-key') {
      this.client = new GoogleGenAI({ apiKey: apiKey.trim() });
      this.logger.log(`GeminiProvider initialized with model: ${this.modelName}`);
    } else {
      this.logger.warn('GEMINI_API_KEY is not configured or empty. GeminiProvider will be marked unavailable.');
    }
  }

  isAvailable(): boolean {
    return !!this.client;
  }

  async extractCv(cleanedText: string): Promise<AiExtractionResult> {
    if (!this.client) {
      throw new Error('GEMINI_API_KEY is missing or invalid.');
    }

    const prompt = `${CV_SYSTEM_PROMPT}\n\n--- DƯỚI ĐÂY LÀ VĂN BẢN CV CẦN PHÂN TÍCH ---\n${cleanedText}`;

    const response = await this.client.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: CV_EXTRACTION_GEMINI_SCHEMA,
        temperature: 0.1,
      },
    });

    const text = response.text ? response.text.trim() : '{}';
    const parsed = JSON.parse(text) as StandardCvProfile;

    return {
      profile: parsed,
      modelUsed: this.modelName,
      tokensUsed: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      },
      confidenceScore: 95,
    };
  }

  
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.client || !text || text.trim() === '') {
      return [];
    }

    try {
      const response = await this.client.models.embedContent({
        model: 'text-embedding-004',
        contents: text.trim(),
      });

      const values =
        (response as any).embedding?.values ||
        (response as any).embeddings?.[0]?.values ||
        [];
      return values;
    } catch (err: any) {
      this.logger.warn(`Gemini embedContent warning: ${err.message}`);
      return [];
    }
  }

  async generateInterviewQuestions(prompt: string, systemInstruction: string): Promise<any> {
    if (!this.client) {
      throw new Error('GEMINI_API_KEY is missing or invalid.');
    }

    const response = await this.client.models.generateContent({
      model: this.modelName,
      contents: `${systemInstruction}\n\n${prompt}`,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text ? response.text.trim() : '{}';
    return JSON.parse(text);
  }

  async extractJdCriteria(prompt: string, systemInstruction: string): Promise<any> {
    if (!this.client) {
      throw new Error('GEMINI_API_KEY is missing or invalid.');
    }

    const response = await this.client.models.generateContent({
      model: this.modelName,
      contents: `${systemInstruction}\n\n${prompt}`,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const text = response.text ? response.text.trim() : '{}';
    return JSON.parse(text);
  }
}
