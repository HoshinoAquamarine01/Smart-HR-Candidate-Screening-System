import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}


  @Get('dashboard')
  async getDashboardOverview(@Query() query: DashboardQueryDto) {
    return this.analyticsService.getDashboardOverview(query);
  }
}

