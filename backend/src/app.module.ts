import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './modules/ai/ai.module';
import { CvModule } from './modules/cv/cv.module';
import { ScreeningModule } from './modules/screening/screening.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { CandidatesModule } from './modules/candidates/candidates.module';

@Module({
  imports: [
    AiModule,
    CvModule,
    ScreeningModule,
    InterviewsModule,
    AssessmentsModule,
    CandidatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
