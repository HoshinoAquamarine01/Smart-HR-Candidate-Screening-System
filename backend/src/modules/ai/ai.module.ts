import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { MockAiProvider } from './providers/mock.provider';

@Module({
  controllers: [AiController],
  providers: [
    GeminiProvider,
    OpenAiProvider,
    MockAiProvider,
    AiService,
  ],
  exports: [AiService, GeminiProvider, OpenAiProvider, MockAiProvider],
})
export class AiModule {}
