import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { CandidateProfileZodSchema } from '../schemas/cv-extraction.schema';
import { CV_SYSTEM_PROMPT } from '../prompts/cv-extraction.prompt';
import { StandardCvProfile } from '../interfaces/standard-cv.interface';
import { AiExtractionResult, IAiProvider } from '../interfaces/ai-provider.interface';

@Injectable()
export class OpenAiProvider implements IAiProvider {
  readonly name = 'OpenAI';
  private readonly logger = new Logger(OpenAiProvider.name);
  private client: OpenAI | null = null;
  private readonly modelName = 'gpt-4o-mini';

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('openaiApiKey') ||
      this.configService.get<string>('openaiKey') ||
      this.configService.get<string>('OPENAI_API_KEY') ||
      process.env.OPENAI_API_KEY ||
      process.env.OPENAI_KEY;

    if (apiKey && apiKey.trim() !== '' && apiKey !== 'dummy-key') {
      this.client = new OpenAI({ apiKey: apiKey.trim() });
      this.logger.log(`OpenAiProvider initialized with model: ${this.modelName}`);
    } else {
      this.logger.warn('OPENAI_API_KEY is not defined. OpenAiProvider will be marked unavailable.');
    }
  }

  isAvailable(): boolean {
    return !!this.client;
  }

  async extractCv(cleanedText: string): Promise<AiExtractionResult> {
    if (!this.client) {
      throw new Error('OPENAI_API_KEY is missing or invalid.');
    }

    const completionsApi = this.client.chat.completions as any;
    let parsedProfile: any = null;
    let tokensUsed: any = null;

    if (typeof completionsApi.parse === 'function') {
      const completion = await completionsApi.parse({
        model: this.modelName,
        messages: [
          { role: 'system', content: CV_SYSTEM_PROMPT },
          { role: 'user', content: `--- DƯỚI ĐÂY LÀ VĂN BẢN CV CẦN PHÂN TÍCH ---\n${cleanedText}` },
        ],
        response_format: zodResponseFormat(CandidateProfileZodSchema, 'candidate_cv_profile'),
        temperature: 0.1,
      });

      const message = completion.choices[0]?.message;
      if (message?.refusal) {
        throw new Error(`OpenAI Model Refused to extract CV: ${message.refusal}`);
      }
      if (!message?.parsed) {
        throw new Error('OpenAI Structured Output parsing returned null');
      }
      parsedProfile = message.parsed;
      tokensUsed = completion.usage;
    } else {
      // Fallback using standard create with response_format json_object or zod schema
      const completion = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: CV_SYSTEM_PROMPT },
          { role: 'user', content: `--- DƯỚI ĐÂY LÀ VĂN BẢN CV CẦN PHÂN TÍCH ---\n${cleanedText}` },
        ],
        response_format: zodResponseFormat(CandidateProfileZodSchema, 'candidate_cv_profile') as any,
        temperature: 0.1,
      });

      const content = completion.choices[0]?.message?.content || '{}';
      parsedProfile = JSON.parse(content);
      tokensUsed = completion.usage;
    }

    return {
      profile: parsedProfile as StandardCvProfile,
      modelUsed: `${this.modelName} (fallback)`,
      tokensUsed: {
        promptTokens: tokensUsed?.prompt_tokens || 0,
        completionTokens: tokensUsed?.completion_tokens || 0,
        totalTokens: tokensUsed?.total_tokens || 0,
      },
      confidenceScore: 90,
    };
  }
}
