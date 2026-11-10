import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Applications,
  ApplicationsSchema,
} from '../../schemas/applications.schema';
import { Candidates, CandidatesSchema } from '../../schemas/candidates.schema';
import { Jobs, JobsSchema } from '../../schemas/jobs.schema';
import {
  ScreeningResults,
  ScreeningResultsSchema,
} from '../../schemas/screening_results.schema';
import { Cvs, CvsSchema } from '../../schemas/cvs.schema';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Applications.name, schema: ApplicationsSchema },
      { name: Candidates.name, schema: CandidatesSchema },
      { name: Jobs.name, schema: JobsSchema },
      { name: ScreeningResults.name, schema: ScreeningResultsSchema },
      { name: Cvs.name, schema: CvsSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

