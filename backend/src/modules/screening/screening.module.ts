import { Module } from '@nestjs/common';
import { ScreeningController } from './screening.controller';
import { ScreeningService } from './screening.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [ScreeningController],
  providers: [ScreeningService],
  exports: [ScreeningService],
})
export class ScreeningModule {}
