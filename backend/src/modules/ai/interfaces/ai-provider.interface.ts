import { StandardCvProfile } from './standard-cv.interface';

export interface AiExtractionResult {
  profile: StandardCvProfile;
  modelUsed: string;
  tokensUsed?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  confidenceScore?: number;
}

export interface IAiProvider {
  name: string;
  isAvailable(): boolean;
  extractCv(cleanedText: string): Promise<AiExtractionResult>;
}
