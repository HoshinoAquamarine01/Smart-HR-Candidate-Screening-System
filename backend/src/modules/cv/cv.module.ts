import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { Cvs, CvsSchema } from '../../schemas/cvs.schema';
import { Candidates, CandidatesSchema } from '../../schemas/candidates.schema';

import { OcrModule } from '../ocr/ocr.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cvs.name, schema: CvsSchema },
      { name: Candidates.name, schema: CandidatesSchema },
    ]),
    AuthModule,
    AiModule,
    OcrModule,
  ],
  controllers: [CvController],
  providers: [CvService],
  exports: [CvService],
})
export class CvModule {}
