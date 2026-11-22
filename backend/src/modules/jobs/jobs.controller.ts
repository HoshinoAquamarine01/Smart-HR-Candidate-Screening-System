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
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { ParseJdDto } from './dto/parse-jd.dto';
import type { JobStatus } from './interfaces/job-criteria.interface';

@ApiTags('Jobs')
@Controller('api/v1/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({
    summary: 'Tạo tin tuyển dụng mới kèm AI trích xuất tiêu chí & Embedding',
    description: 'Tạo tin tuyển dụng. Tự động gọi AI phân tích văn bản JD thành requiredSkills, preferredSkills, số năm kinh nghiệm và sinh vector embedding 768 chiều.',
  })
  @ApiResponse({ status: 201, description: 'Tạo tin tuyển dụng thành công' })
  @ApiResponse({ status: 400, description: 'Văn bản JD quá ngắn hoặc tham số không hợp lệ' })
  async create(@Body() dto: CreateJobDto, @Req() req: any) {
    const userId = req.user?.id || req.user?._id;
    return this.jobsService.create(dto, userId);
  }

  @Post('parse-jd')
  @ApiOperation({
    summary: 'Xem trước kết quả AI trích xuất tiêu chí từ văn bản JD (không lưu DB)',
    description: 'Nhận văn bản JD thô và trả về cấu trúc tiêu chí dự kiến cùng vector embedding.',
  })
  @ApiResponse({ status: 200, description: 'Phân tích JD thành công' })
  async parseJd(@Body() dto: ParseJdDto) {
    return this.jobsService.parseJd(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách tin tuyển dụng',
    description: 'Hỗ trợ phân trang, tìm kiếm theo tiêu đề, lọc theo phòng ban và trạng thái (DRAFT/PUBLISHED/CLOSED).',
  })
  @ApiResponse({ status: 200, description: 'Danh sách tin tuyển dụng' })
  async findAll(@Query() query: QueryJobDto) {
    return this.jobsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết tin tuyển dụng & thống kê phễu ứng viên',
    description: 'Trả về thông tin JD, tiêu chí trích xuất và số lượng ứng viên theo từng trạng thái.',
  })
  @ApiParam({ name: 'id', description: 'Mã ObjectId của tin tuyển dụng' })
  @ApiResponse({ status: 200, description: 'Chi tiết tin tuyển dụng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tin tuyển dụng' })
  async findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Cập nhật thông tin tin tuyển dụng',
    description: 'Cập nhật tiêu đề, phòng ban hoặc mô tả JD (tùy chọn bóc tách lại AI).',
  })
  @ApiParam({ name: 'id', description: 'Mã ObjectId của tin tuyển dụng' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?._id;
    return this.jobsService.update(id, dto, userId);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Đổi trạng thái nhanh cho tin tuyển dụng (DRAFT / PUBLISHED / CLOSED)',
  })
  @ApiParam({ name: 'id', description: 'Mã ObjectId của tin tuyển dụng' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'CLOSED'], example: 'PUBLISHED' },
      },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'Đổi trạng thái thành công' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: JobStatus,
  ) {
    return this.jobsService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa tin tuyển dụng (Tự động chuyển sang CLOSED nếu đã có ứng viên)',
    description: 'Bảo vệ toàn vẹn dữ liệu: Không xóa vĩnh viễn tin tuyển dụng đã có hồ sơ ứng tuyển.',
  })
  @ApiParam({ name: 'id', description: 'Mã ObjectId của tin tuyển dụng' })
  @ApiResponse({ status: 200, description: 'Xóa hoặc đóng tin tuyển dụng thành công' })
  async remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }
}
