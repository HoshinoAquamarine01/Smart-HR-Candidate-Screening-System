import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { Jobs, JobsSchema } from '../../schemas/jobs.schema';
import {
  Applications,
  ApplicationsSchema,
} from '../../schemas/applications.schema';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    AiModule,
    MongooseModule.forFeature([
      { name: Jobs.name, schema: JobsSchema },
      { name: Applications.name, schema: ApplicationsSchema },
    ]),
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}

