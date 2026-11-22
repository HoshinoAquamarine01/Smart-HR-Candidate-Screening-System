import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('AI Engine & Status')
@Controller('api/v1/ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly geminiProvider: GeminiProvider,
    private readonly openaiProvider: OpenAiProvider,
  ) {}

  @Get('status')
  @ApiOperation({
    summary: 'Kiểm tra trạng thái sẵn sàng của các nhà cung cấp AI (Gemini / OpenAI / Heuristic Mock)',
    description: 'Báo cáo tính khả dụng của Google Gemini 2.0 Flash API và OpenAI API.',
  })
  @ApiResponse({ status: 200, description: 'Trạng thái các AI Provider' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Trích xuất trực tiếp dữ liệu cấu trúc từ đoạn văn bản thô',
    description: 'Gửi văn bản CV thô để trích xuất thành đối tượng StandardCv có cấu trúc.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          example: 'Nguyễn Văn A. Senior Backend Developer. 5 years experience with NestJS, MongoDB, Docker.',
        },
      },
      required: ['text'],
    },
  })
  @ApiResponse({ status: 200, description: 'Dữ liệu CV cấu trúc trích xuất' })
  async extractText(@Body('text') text: string) {
    return this.aiService.extractCvStructuredData(text);
  }
}
