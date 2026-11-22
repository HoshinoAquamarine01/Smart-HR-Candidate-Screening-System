import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import { QueryCandidateDto } from './dto/query-candidate.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { UpdateCandidateStatusDto } from './dto/update-candidate-status.dto';

@ApiTags('Candidates')
@Controller('api/v1/candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách ứng viên & lọc đa chiều',
    description: 'Truy xuất danh sách ứng viên từ MongoDB. Hỗ trợ tìm kiếm theo tên/email, lọc theo kỹ năng (skill), trạng thái tuyển dụng (status), tin tuyển dụng (jobId), điểm matching tối thiểu (minScore) và phân trang.',
  })
  @ApiResponse({ status: 200, description: 'Danh sách ứng viên kèm phân trang' })
  async findAll(@Query() query: QueryCandidateDto) {
    return this.candidatesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Xem chi tiết hồ sơ 360° của ứng viên',
    description: 'Trả về thông tin cá nhân, toàn bộ dữ liệu CV đã bóc tách (kỹ năng, kinh nghiệm, dự án, học vấn), các tập tin CV đính kèm và lịch sử ứng tuyển kèm điểm số AI Screening.',
  })
  @ApiParam({ name: 'id', description: 'Mã ObjectId của ứng viên' })
  @ApiResponse({ status: 200, description: 'Hồ sơ chi tiết 360°' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ứng viên' })
  async findOne(@Param('id') id: string) {
    return this.candidatesService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Tạo mới hoặc khử trùng lặp hồ sơ ứng viên theo email',
    description: 'Nếu email đã tồn tại trong CSDL, hệ thống tự động trả về hồ sơ hiện hữu, tránh sinh bản ghi trùng rác.',
  })
  @ApiResponse({ status: 201, description: 'Tạo hoặc trả về ứng viên thành công' })
  async create(@Body() dto: CreateCandidateDto) {
    return this.candidatesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Cập nhật thông tin hồ sơ ứng viên & bật/tắt cờ ẩn danh (Blind Screening)',
    description: 'Cập nhật thông tin liên hệ, chức danh hoặc kích hoạt cờ anonymized để sàng lọc không thiên vị.',
  })
  @ApiParam({ name: 'id', description: 'Mã ObjectId của ứng viên' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCandidateDto,
  ) {
    return this.candidatesService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Chuyển trạng thái tuyển dụng của ứng viên',
    description: 'Cập nhật trạng thái tuyển dụng của ứng viên (đồng bộ sang đơn ứng tuyển).',
  })
  @ApiParam({ name: 'id', description: 'Mã ObjectId của ứng viên' })
  @ApiResponse({ status: 200, description: 'Đổi trạng thái thành công' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCandidateStatusDto,
  ) {
    return this.candidatesService.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa hồ sơ ứng viên & cascade dọn dẹp đơn ứng tuyển liên quan',
  })
  @ApiParam({ name: 'id', description: 'Mã ObjectId của ứng viên' })
  @ApiResponse({ status: 200, description: 'Xóa hồ sơ thành công' })
  async remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }
}
