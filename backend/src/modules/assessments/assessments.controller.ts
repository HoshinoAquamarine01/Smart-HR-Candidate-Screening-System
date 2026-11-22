import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';

@ApiTags('Candidate Assessments')
@Controller('api/v1/assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post('create')
  @ApiOperation({
    summary: 'Tạo bài đánh giá / khảo sát năng lực ứng viên',
  })
  @ApiResponse({ status: 201, description: 'Tạo bài đánh giá thành công' })
  async createAssessment(@Body() dto: CreateAssessmentDto) {
    return this.assessmentsService.createAssessment(dto);
  }
}
