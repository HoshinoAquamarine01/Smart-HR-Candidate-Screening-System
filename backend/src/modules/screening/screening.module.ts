import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScreeningController } from './screening.controller';
import { ScreeningService } from './screening.service';
import { MatchingEngineService } from './services/matching-engine.service';
import { SkillTaxonomyService } from './services/skill-taxonomy.service';
import { AiModule } from '../ai/ai.module';
import { Cvs, CvsSchema } from '../../schemas/cvs.schema';
import { Jobs, JobsSchema } from '../../schemas/jobs.schema';
import {
  ScreeningResults,
  ScreeningResultsSchema,
} from '../../schemas/screening_results.schema';
import { Candidates, CandidatesSchema } from '../../schemas/candidates.schema';

@Module({
  imports: [
    AiModule,
    MongooseModule.forFeature([
      { name: Cvs.name, schema: CvsSchema },
      { name: Jobs.name, schema: JobsSchema },
      { name: ScreeningResults.name, schema: ScreeningResultsSchema },
      { name: Candidates.name, schema: CandidatesSchema },
    ]),
  ],
  controllers: [ScreeningController],
  providers: [ScreeningService, MatchingEngineService, SkillTaxonomyService],
  exports: [ScreeningService, MatchingEngineService, SkillTaxonomyService],
})
export class ScreeningModule {}
