import { Controller, Post, Body } from '@nestjs/common';
import { ScreeningService } from './screening.service';
import { MatchScreeningDto } from './dto/match-screening.dto';

@Controller('api/v1/screening')
export class ScreeningController {
  constructor(private readonly screeningService: ScreeningService) {}

  @Post('match')
  async matchScreening(@Body() dto: MatchScreeningDto) {
    return this.screeningService.matchScreening(dto);
  }
}
