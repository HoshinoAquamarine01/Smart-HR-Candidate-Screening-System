import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('api/v1/ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly geminiProvider: GeminiProvider,
    private readonly openaiProvider: OpenAiProvider,
  ) {}

  @Get('status')
  getStatus() {
    return {
      status: 'ok',
      providers: {
        gemini: {
          available: this.geminiProvider.isAvailable(),
        },
        openai: {
          available: this.openaiProvider.isAvailable(),
        },
        mockFallback: true,
      },
      timestamp: new Date(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('extract-text')
  async extractText(@Body('text') text: string) {
    return this.aiService.extractCvStructuredData(text);
  }
}
