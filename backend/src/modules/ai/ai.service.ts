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


  async generateInterviewQuestions(
    prompt: string,
    systemInstruction: string,
    fallbackContext?: any,
  ): Promise<{ questions: any[] }> {
    let result: any = null;

    if (this.geminiProvider.isAvailable()) {
      try {
        this.logger.log('Generating interview questions using Google Gemini...');
        result = await (this.geminiProvider as any).generateInterviewQuestions(
          prompt,
          systemInstruction,
        );
      } catch (err: any) {
        this.logger.warn(`Gemini interview generation failed: ${err.message}. Trying OpenAI...`);
      }
    }

  
    if (!result && this.openaiProvider.isAvailable()) {
      try {
        this.logger.log('Generating interview questions using OpenAI...');
        result = await (this.openaiProvider as any).generateInterviewQuestions(
          prompt,
          systemInstruction,
        );
      } catch (err: any) {
        this.logger.warn(`OpenAI interview generation failed: ${err.message}. Falling back to Mock...`);
      }
    }

   
    if (!result) {
      this.logger.log('Generating interview questions using MockAiProvider (deterministic fallback)...');
      result = await this.mockAiProvider.generateInterviewQuestions(fallbackContext || {});
    }

    if (Array.isArray(result)) {
      return { questions: result };
    }
    if (result && Array.isArray(result.questions)) {
      return { questions: result.questions };
    }

    return { questions: [] };
  }

  
  async extractJdCriteria(rawDescription: string, jobTitle?: string): Promise<any> {
    const systemPrompt = `
You are an expert HR and Technical Recruiter.
Analyze the following Job Description and extract structured evaluation criteria in strict JSON format:
{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "minExperienceYears": 2,
  "requiredEducation": "Degree requirements",
  "responsibilities": ["item1", "item2"],
  "seniorityLevel": "INTERN" | "JUNIOR" | "MIDDLE" | "SENIOR" | "LEAD"
}
`;
    const userPrompt = `Job Title: ${jobTitle || 'N/A'}\n\nJob Description:\n${rawDescription}`;

    let result: any = null;

    
    if (this.geminiProvider.isAvailable()) {
      try {
        this.logger.log('Extracting JD criteria using Google Gemini...');
        result = await (this.geminiProvider as any).extractJdCriteria(userPrompt, systemPrompt);
      } catch (err: any) {
        this.logger.warn(`Gemini JD extraction failed: ${err.message}. Trying OpenAI...`);
      }
    }

   
    if (!result && this.openaiProvider.isAvailable()) {
      try {
        this.logger.log('Extracting JD criteria using OpenAI...');
        result = await (this.openaiProvider as any).extractJdCriteria(userPrompt, systemPrompt);
      } catch (err: any) {
        this.logger.warn(`OpenAI JD extraction failed: ${err.message}. Falling back to Mock...`);
      }
    }

    if (!result) {
      this.logger.log('Extracting JD criteria using MockAiProvider (heuristic fallback)...');
      result = await this.mockAiProvider.extractJdCriteria(rawDescription, jobTitle);
    }

    return result;
  }

  // --------------------------------------------------------------------------
  // In-Memory Embedding Cache (reduces latency & costs for repeated queries)
  // --------------------------------------------------------------------------
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
