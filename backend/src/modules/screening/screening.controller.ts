import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ScreeningService } from './screening.service';
import { MatchScreeningDto } from './dto/match-screening.dto';

@Controller('api/v1/screening')
export class ScreeningController {
  constructor(private readonly screeningService: ScreeningService) {}

  
  @Post('match')
  async matchScreening(@Body() dto: MatchScreeningDto) {
    return this.screeningService.matchScreening(dto);
  }

  
  @Post('rank/:jobId')
  async rankCandidates(
    @Param('jobId') jobId: string,
    @Query('limit') limit?: number,
  ) {
    return this.screeningService.rankCandidatesForJob(jobId, limit ? Number(limit) : 20);
  }

  
  @Get('taxonomy/lookup')
  lookupSkill(@Query('skill') skill: string) {
    return this.screeningService.lookupSkill(skill || '');
  }
}
