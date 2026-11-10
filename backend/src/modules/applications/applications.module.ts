import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Applications,
  ApplicationsSchema,
} from '../../schemas/applications.schema';
import { Candidates, CandidatesSchema } from '../../schemas/candidates.schema';
import { Jobs, JobsSchema } from '../../schemas/jobs.schema';
import { Cvs, CvsSchema } from '../../schemas/cvs.schema';
import {
  ScreeningResults,
  ScreeningResultsSchema,
} from '../../schemas/screening_results.schema';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Applications.name, schema: ApplicationsSchema },
      { name: Candidates.name, schema: CandidatesSchema },
      { name: Jobs.name, schema: JobsSchema },
      { name: Cvs.name, schema: CvsSchema },
      { name: ScreeningResults.name, schema: ScreeningResultsSchema },
    ]),
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}

