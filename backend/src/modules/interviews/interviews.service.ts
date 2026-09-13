import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { GenerateInterviewDto } from './dto/generate-interview.dto';

@Injectable()
export class InterviewsService {
  constructor(private readonly aiService: AiService) {}

  async generateQuestions(dto: GenerateInterviewDto) {
    // Stub - dynamic tailored question generation
    return {
      questions: [
        {
          id: 'q1',
          question: 'Sample technical interview question stub',
          category: 'NestJS Architecture',
          difficulty: 'Hard',
          expectedKeyPoints: ['Dependency Injection', 'Modules', 'Interceptors'],
        },
      ],
    };
  }
}
