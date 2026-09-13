import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';

@Injectable()
export class AssessmentsService {
  constructor(private readonly aiService: AiService) {}

  async createAssessment(dto: CreateAssessmentDto) {
    // Stub - technical test challenge generation
    return {
      title: 'Senior Fullstack Engineering Assessment Stub',
      durationMinutes: 60,
      tasks: [
        {
          id: 'task-1',
          title: 'Implement Rate Limiter Middleware',
          description: 'Task description stub',
        },
      ],
    };
  }
}
