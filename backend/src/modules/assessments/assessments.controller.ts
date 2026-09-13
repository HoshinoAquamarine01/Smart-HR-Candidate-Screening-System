import { Controller, Post, Body } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';

@Controller('api/v1/assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post('create')
  async createAssessment(@Body() dto: CreateAssessmentDto) {
    return this.assessmentsService.createAssessment(dto);
  }
}
