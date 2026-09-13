import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { ParseCvDto } from './dto/parse-cv.dto';

@Injectable()
export class CvService {
  constructor(private readonly aiService: AiService) {}

  async parseCv(parseCvDto: ParseCvDto) {
    // Stub - extract text & structure CV profile via AI
    return {
      message: 'CV parse stub',
      candidateProfile: {
        fullName: 'Candidate Name Stub',
        skills: ['TypeScript', 'NestJS', 'React'],
        experience: [],
        education: [],
      },
    };
  }
}
