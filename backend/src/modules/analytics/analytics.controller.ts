import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@ApiTags('Recruitment Analytics')
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Lấy số liệu tổng quan Dashboard & biểu đồ tuyển dụng [FR-REP-01]',
    description: 'Trích xuất dữ liệu tổng hợp phục vụ hiển thị các thẻ KPIs, biểu đồ phễu 7 vòng Kanban, biểu đồ tròn phân vị điểm số (<50%, 50-75%, >75%) và Top 5 kỹ năng ứng viên còn thiếu hụt nhiều nhất.',
  })
  @ApiQuery({ name: 'jobId', required: false, description: 'Lọc số liệu riêng cho 1 vị trí tuyển dụng' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Lọc hồ sơ nộp từ ngày (ISO 8601, VD: 2026-11-01)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Lọc hồ sơ nộp đến ngày (ISO 8601, VD: 2026-11-30)' })
  @ApiResponse({ status: 200, description: 'Dữ liệu báo cáo Dashboard thành công' })
  async getDashboardOverview(@Query() query: DashboardQueryDto) {
    return this.analyticsService.getDashboardOverview(query);
  }
}
