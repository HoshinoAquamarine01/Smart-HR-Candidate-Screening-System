import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { Cvs, CvsSchema } from '../../schemas/cvs.schema';
import { Candidates, CandidatesSchema } from '../../schemas/candidates.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cvs.name, schema: CvsSchema },
      { name: Candidates.name, schema: CandidatesSchema },
    ]),
    AuthModule,
    AiModule,
  ],
  controllers: [CvController],
  providers: [CvService],
  exports: [CvService],
})
export class CvModule {}
