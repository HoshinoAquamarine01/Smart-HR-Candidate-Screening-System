import { Controller, Post, Body } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { GenerateInterviewDto } from './dto/generate-interview.dto';

@Controller('api/v1/interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post('generate')
  async generateQuestions(@Body() dto: GenerateInterviewDto) {
    return this.interviewsService.generateQuestions(dto);
  }
}
