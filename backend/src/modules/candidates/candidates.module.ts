import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import {
  Candidates,
  CandidatesSchema,
} from '../../schemas/candidates.schema';
import {
  Applications,
  ApplicationsSchema,
} from '../../schemas/applications.schema';
import { Cvs, CvsSchema } from '../../schemas/cvs.schema';
import { Jobs, JobsSchema } from '../../schemas/jobs.schema';
import {
  ScreeningResults,
  ScreeningResultsSchema,
} from '../../schemas/screening_results.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Candidates.name, schema: CandidatesSchema },
      { name: Applications.name, schema: ApplicationsSchema },
      { name: Cvs.name, schema: CvsSchema },
      { name: Jobs.name, schema: JobsSchema },
      { name: ScreeningResults.name, schema: ScreeningResultsSchema },
    ]),
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
