import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { MatchScreeningDto } from './dto/match-screening.dto';

@Injectable()
export class ScreeningService {
  constructor(private readonly aiService: AiService) {}

  async matchScreening(dto: MatchScreeningDto) {
    // Stub - multi-dimensional fit scoring
    return {
      matchScore: 88,
      breakdown: {
        technicalSkillFit: 90,
        seniorityMatch: 85,
        domainRelevance: 89,
      },
      rationaleSummary: 'Strong candidate match stub summary.',
    };
  }
}
