import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@ApiTags('Applications & Kanban')
@Controller('api/v1/applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get('kanban')
  @ApiOperation({
    summary: 'Lấy dữ liệu bảng Kanban phân nhóm theo 7 cột trạng thái',
    description: 'Nhóm toàn bộ hồ sơ ứng tuyển theo 7 cột trạng thái (NEW, SCREENING, SHORTLISTED, INTERVIEW, OFFER, HIRED, REJECTED) kèm thẻ điểm số AI Matching Radar. Hỗ trợ lọc theo jobId.',
  })
  @ApiQuery({ name: 'jobId', required: false, description: 'Lọc riêng cho 1 vị trí tuyển dụng' })
  @ApiResponse({ status: 200, description: 'Dữ liệu bảng Kanban thành công' })
  async getKanbanBoard(@Query('jobId') jobId?: string) {
    return this.applicationsService.getKanbanBoard(jobId);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách đơn ứng tuyển & lọc đa tiêu chí',
    description: 'Lọc theo jobId, candidateId, status, tiến trình AI (aiPipelineStatus), tìm kiếm tên/email ứng viên và điểm sàn matching (minScore).',
  })
  @ApiResponse({ status: 200, description: 'Danh sách đơn ứng tuyển' })
  async findAll(@Query() query: QueryApplicationDto) {
    return this.applicationsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Xem chi tiết đơn ứng tuyển (kèm radar điểm AI & lịch sử quyết định)',
  })
  @ApiParam({ name: 'id', description: 'Mã ObjectId của đơn ứng tuyển' })
  @ApiResponse({ status: 200, description: 'Chi tiết đơn ứng tuyển' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn ứng tuyển' })
  async findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Nộp đơn ứng tuyển (Khử trùng lặp candidateId + jobId)',
    description: 'Tạo đơn ứng tuyển mới. Nếu ứng viên đã nộp cho tin tuyển dụng này, tự động trả về đơn hiện hữu.',
  })
  @ApiResponse({ status: 201, description: 'Tạo đơn ứng tuyển thành công' })
  async create(@Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(dto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Kéo/thả ứng viên giữa các cột Kanban [FR-CAND-03]',
    description: 'Cập nhật trạng thái ứng viên (NEW -> SCREENING -> SHORTLISTED -> INTERVIEW -> OFFER -> HIRED / REJECTED) và tự động ghi nhật ký kiểm toán (audit trail) kèm thời gian, người quyết định, lý do hoặc thông tin thư mời nhận việc.',
  })
  @ApiParam({ name: 'id', description: 'Mã ObjectId của đơn ứng tuyển' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái Kanban thành công' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa đơn ứng tuyển & dọn dẹp cascade kết quả screening liên quan',
  })
  @ApiParam({ name: 'id', description: 'Mã ObjectId của đơn ứng tuyển' })
  @ApiResponse({ status: 200, description: 'Xóa đơn ứng tuyển thành công' })
  async remove(@Param('id') id: string) {
    return this.applicationsService.remove(id);
  }
}
