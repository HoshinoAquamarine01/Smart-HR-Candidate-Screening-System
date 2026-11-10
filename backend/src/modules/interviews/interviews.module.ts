import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { QuestionBankService } from './services/question-bank.service';
import { AiModule } from '../ai/ai.module';
import {
  InterviewQuestions,
  InterviewQuestionsSchema,
} from '../../schemas/interview_questions.schema';
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

@Module({
  imports: [
    AiModule,
    MongooseModule.forFeature([
      { name: InterviewQuestions.name, schema: InterviewQuestionsSchema },
      { name: Applications.name, schema: ApplicationsSchema },
      { name: Candidates.name, schema: CandidatesSchema },
      { name: Jobs.name, schema: JobsSchema },
      { name: Cvs.name, schema: CvsSchema },
      { name: ScreeningResults.name, schema: ScreeningResultsSchema },
    ]),
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService, QuestionBankService],
  exports: [InterviewsService, QuestionBankService],
})
export class InterviewsModule {}
