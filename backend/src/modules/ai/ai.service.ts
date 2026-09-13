import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  /**
   * Stub method to prompt LLM (OpenAI / Gemini) and return structured JSON
   */
  async generateCompletion(prompt: string, schema?: object): Promise<any> {
    // Logic stub - to be implemented
    return { status: 'stub', promptReceived: prompt };
  }
}
