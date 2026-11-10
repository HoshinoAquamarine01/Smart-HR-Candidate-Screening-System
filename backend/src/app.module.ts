import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './modules/ai/ai.module';
import { CvModule } from './modules/cv/cv.module';
import { ScreeningModule } from './modules/screening/screening.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OcrModule } from './modules/ocr/ocr.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongoUri'),
      }),
    }),
    AiModule,
    CvModule,
    ScreeningModule,
    InterviewsModule,
    AssessmentsModule,
    CandidatesModule,
    JobsModule,
    ApplicationsModule,
    AnalyticsModule,
    AuthModule,
    UsersModule,
    OcrModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

