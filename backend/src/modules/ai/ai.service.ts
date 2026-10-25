import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { MockAiProvider } from './providers/mock.provider';
import { FullParsedCvData, StandardCvProfile } from './interfaces/standard-cv.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly geminiProvider: GeminiProvider,
    private readonly openaiProvider: OpenAiProvider,
    private readonly mockAiProvider: MockAiProvider,
  ) {}

  /**
   * Pre-sanitize extracted text to reduce tokens and remove noise
   */
  private sanitizeText(rawText: string): string {
    return rawText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') // remove control chars
      .trim();
  }

  /**
   * Extract standardized structured data from CV text using LLM
   */
  async extractCvStructuredData(cleanedText: string): Promise<FullParsedCvData> {
    const startTime = Date.now();
    const sanitized = this.sanitizeText(cleanedText || '');

    if (!sanitized || sanitized.length < 30) {
      this.logger.warn('CV text too short or empty for LLM extraction.');
      throw new BadRequestException(
        'Văn bản CV quá ngắn hoặc rỗng, không đủ nội dung để phân tích bóc tách.',
      );
    }

    let extractionResult: {
      profile: StandardCvProfile;
      modelUsed: string;
      tokensUsed?: any;
      confidenceScore?: number;
    } | null = null;

    // 1. Primary: Google Gemini 2.0 Flash
    if (this.geminiProvider.isAvailable()) {
      try {
        this.logger.log('Attempting CV extraction with Google Gemini...');
        extractionResult = await this.geminiProvider.extractCv(sanitized);
      } catch (err: any) {
        this.logger.warn(`Gemini extraction failed: ${err.message}. Checking fallback provider...`);
      }
    }

    // 2. Secondary fallback: OpenAI GPT-4o-mini
    if (!extractionResult && this.openaiProvider.isAvailable()) {
      try {
        this.logger.log('Attempting CV extraction with OpenAI fallback...');
        extractionResult = await this.openaiProvider.extractCv(sanitized);
      } catch (err: any) {
        this.logger.warn(`OpenAI extraction failed: ${err.message}. Falling back to Mock...`);
      }
    }

    // 3. Fallback: Mock Provider (for offline development / test when API keys not provided)
    if (!extractionResult) {
      this.logger.log('Using MockAiProvider fallback for structured CV profile');
      extractionResult = await this.mockAiProvider.extractCv(sanitized);
    }

    const processingTimeMs = Date.now() - startTime;

    return {
      profile: extractionResult.profile,
      ocrMetadata: {
        cleanedLength: sanitized.length,
      },
      extractionMetadata: {
        extractorModel: extractionResult.modelUsed,
        confidenceScore: extractionResult.confidenceScore ?? 90,
        processingTimeMs,
        tokensUsed: extractionResult.tokensUsed,
        extractedAt: new Date(),
      },
    };
  }

  /**
   * Backward-compatible stub
   */
  async generateCompletion(prompt: string, schema?: object): Promise<any> {
    return { status: 'stub', promptReceived: prompt };
  }
}
