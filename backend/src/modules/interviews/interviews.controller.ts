import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { QuestionBankService } from './services/question-bank.service';
import { GenerateInterviewDto } from './dto/generate-interview.dto';
import { UpdateInterviewQuestionsDto } from './dto/update-interview.dto';
import { ExportInterviewDto } from './dto/export-interview.dto';
import type { InterviewCategory } from './interfaces/interview-question.interface';

@Controller('api/v1/interviews')
export class InterviewsController {
  constructor(
    private readonly interviewsService: InterviewsService,
    private readonly questionBankService: QuestionBankService,
  ) {}

  /**
   * Generates grounded, tailored interview questions using RAG
   * POST /api/v1/interviews/generate
   */
  @Post('generate')
  async generateQuestions(@Body() dto: GenerateInterviewDto, @Req() req: any) {
    const userId = req.user?.id || req.user?._id;
    return this.interviewsService.generateQuestions(dto, userId);
  }

  /**
   * Retrieves interview questions by application ID
   * GET /api/v1/interviews/application/:applicationId
   */
  @Get('application/:applicationId')
  async getByApplicationId(@Param('applicationId') applicationId: string) {
    return this.interviewsService.getQuestionsByApplicationId(applicationId);
  }

  /**
   * Retrieves interview questions by document ID
   * GET /api/v1/interviews/:id
   */
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.interviewsService.getQuestionsById(id);
  }

  /**
   * Human-in-the-loop updates: edit, delete, re-order, score or take notes
   * PUT /api/v1/interviews/:id
   */
  @Put(':id')
  async updateQuestions(
    @Param('id') id: string,
    @Body() dto: UpdateInterviewQuestionsDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?._id;
    return this.interviewsService.updateQuestions(id, dto, userId);
  }

  /**
   * Export interview questions to Markdown, Text, or JSON
   * POST /api/v1/interviews/:id/export
   */
  @Post(':id/export')
  async exportQuestions(
    @Param('id') id: string,
    @Body() dto: ExportInterviewDto,
  ) {
    return this.interviewsService.exportQuestions(id, dto.format || 'markdown');
  }

  /**
   * Lookup templates from the Domain Question Bank
   * GET /api/v1/interviews/question-bank/templates
   */
  @Get('question-bank/templates')
  async searchTemplates(
    @Query('skills') skills?: string,
    @Query('category') category?: InterviewCategory,
    @Query('limit') limit?: number,
  ) {
    const skillsList = skills ? skills.split(',').map((s) => s.trim()) : [];
    const categories = category ? [category] : undefined;
    return this.questionBankService.retrieveRelevantTemplates({
      skills: skillsList,
      categories,
      topK: limit || 10,
    });
  }
}
