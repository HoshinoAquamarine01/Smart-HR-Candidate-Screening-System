import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { MockAiProvider } from './providers/mock.provider';
import { FullParsedCvData, StandardCvProfile } from './interfaces/standard-cv.interface';
import { CandidateSanitizerUtil } from './utils/candidate-sanitizer.util';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly geminiProvider: GeminiProvider,
    private readonly openaiProvider: OpenAiProvider,
    private readonly mockAiProvider: MockAiProvider,
  ) {}

  
  private sanitizeText(rawText: string): string {
    return CandidateSanitizerUtil.sanitizeRawCvText(rawText);
  }

  
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

    if (this.geminiProvider.isAvailable()) {
      try {
        this.logger.log('Attempting CV extraction with Google Gemini...');
        extractionResult = await this.geminiProvider.extractCv(sanitized);
      } catch (err: any) {
        this.logger.warn(`Gemini extraction failed: ${err.message}. Checking fallback provider...`);
      }
    }

   
    if (!extractionResult && this.openaiProvider.isAvailable()) {
      try {
        this.logger.log('Attempting CV extraction with OpenAI fallback...');
        extractionResult = await this.openaiProvider.extractCv(sanitized);
      } catch (err: any) {
        this.logger.warn(`OpenAI extraction failed: ${err.message}. Falling back to Mock...`);
      }
    }

 
    if (!extractionResult) {
      this.logger.log('Using MockAiProvider fallback for structured CV profile');
      extractionResult = await this.mockAiProvider.extractCv(sanitized);
    }

   
    const reasoning = extractionResult.profile._reasoning;
    delete (extractionResult.profile as any)._reasoning;

    
    const sanitizedProfile = CandidateSanitizerUtil.sanitizeCandidateProfile(extractionResult.profile);

   
    const dynamicConfidence = CandidateSanitizerUtil.calculateDynamicConfidenceScore(sanitizedProfile);

    const processingTimeMs = Date.now() - startTime;

    return {
      profile: sanitizedProfile,
      ocrMetadata: {
        cleanedLength: sanitized.length,
      },
      extractionMetadata: {
        extractorModel: extractionResult.modelUsed,
        confidenceScore: dynamicConfidence,
        processingTimeMs,
        reasoning,
        tokensUsed: extractionResult.tokensUsed,
        extractedAt: new Date(),
      },
    };
  }

 
  async generateCompletion(prompt: string, schema?: object): Promise<any> {
    return { status: 'stub', promptReceived: prompt };
  }

 
  private readonly embeddingCache = new Map<string, number[]>();

  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim() === '') {
      return [];
    }

    const key = text.trim().toLowerCase();
    if (this.embeddingCache.has(key)) {
      return this.embeddingCache.get(key)!;
    }

    let vector: number[] = [];

   
    if (this.geminiProvider.isAvailable()) {
      try {
        vector = await this.geminiProvider.generateEmbedding(text);
      } catch (err: any) {
        this.logger.warn(`Gemini embedding failed: ${err.message}. Trying OpenAI...`);
      }
    }

  
    if ((!vector || vector.length === 0) && this.openaiProvider.isAvailable()) {
      try {
        vector = await this.openaiProvider.generateEmbedding(text);
      } catch (err: any) {
        this.logger.warn(`OpenAI embedding failed: ${err.message}. Falling back to Mock...`);
      }
    }

   
    if (!vector || vector.length === 0) {
      vector = await this.mockAiProvider.generateEmbedding(text);
    }

    if (vector && vector.length > 0) {
      this.embeddingCache.set(key, vector);
    }

    return vector;
  }
}
