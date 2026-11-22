import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ScreeningService } from './screening.service';
import { MatchScreeningDto } from './dto/match-screening.dto';

@ApiTags('Candidate Screening & Matching')
@Controller('api/v1/screening')
export class ScreeningController {
  constructor(private readonly screeningService: ScreeningService) {}

  @Post('match')
  @ApiOperation({
    summary: 'Chấm điểm tương thích hồ sơ CV và tin tuyển dụng JD [FR-SCR-01]',
    description: 'Thực thi thuật toán Hybrid Matching kết hợp Semantic Vector Cosine Similarity (35%), Skill-based Matching (40%), Experience Scoring (15%) và Education Scoring (10%) kèm giải trình AI XAI Rationale.',
  })
  @ApiResponse({ status: 200, description: 'Kết quả chấm điểm tương thích chi tiết' })
  async matchScreening(@Body() dto: MatchScreeningDto) {
    return this.screeningService.matchScreening(dto);
  }

  @Post('rank/:jobId')
  @ApiOperation({
    summary: 'Xếp hạng Top ứng viên phù hợp nhất cho một vị trí tuyển dụng [FR-SCR-02]',
    description: 'Tự động tính điểm và sắp xếp danh sách ứng viên đã nộp đơn theo thứ tự điểm số từ cao xuống thấp.',
  })
  @ApiParam({ name: 'jobId', description: 'Mã ObjectId của tin tuyển dụng' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng ứng viên tối đa trả về (mặc định 20)' })
  @ApiResponse({ status: 200, description: 'Bảng xếp hạng ứng viên' })
  async rankCandidates(
    @Param('jobId') jobId: string,
    @Query('limit') limit?: number,
  ) {
    return this.screeningService.rankCandidatesForJob(jobId, limit ? Number(limit) : 20);
  }

  @Get('taxonomy/lookup')
  @ApiOperation({
    summary: 'Tra cứu chuẩn hóa kỹ năng từ Skill Taxonomy Dictionary',
    description: 'Chuẩn hóa kỹ năng viết tắt (alias/fuzzy matching, VD: "k8s" -> "Kubernetes", "reactjs" -> "React").',
  })
  @ApiQuery({ name: 'skill', description: 'Tên kỹ năng cần chuẩn hóa' })
  @ApiResponse({ status: 200, description: 'Kết quả chuẩn hóa kỹ năng' })
  lookupSkill(@Query('skill') skill: string) {
    return this.screeningService.lookupSkill(skill || '');
  }
}
