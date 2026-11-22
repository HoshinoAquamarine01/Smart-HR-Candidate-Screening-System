import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';
import { QuestionBankService } from './services/question-bank.service';
import { GenerateInterviewDto } from './dto/generate-interview.dto';
import { UpdateInterviewQuestionsDto } from './dto/update-interview.dto';
import { ExportInterviewDto } from './dto/export-interview.dto';
import type { InterviewCategory } from './interfaces/interview-question.interface';

@ApiTags('AI Interview Generation')
@Controller('api/v1/interviews')
export class InterviewsController {
  constructor(
    private readonly interviewsService: InterviewsService,
    private readonly questionBankService: QuestionBankService,
  ) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Khởi tạo bộ câu hỏi phỏng vấn thích ứng bằng kiến trúc RAG [FR-INT-01]',
    description: 'Truy xuất thông tin từ CV và JD, đối soát khoảng cách kỹ năng (Skill Gap) và kết hợp với ngân hàng câu hỏi chuyên ngành để tạo ra bộ câu hỏi cá nhân hóa kèm thang điểm đánh giá 3 mức (Poor / Acceptable / Excellent).',
  })
  @ApiResponse({ status: 201, description: 'Khởi tạo bộ câu hỏi phỏng vấn thành công' })
  async generateQuestions(@Body() dto: GenerateInterviewDto, @Req() req: any) {
    const userId = req.user?.id || req.user?._id;
    return this.interviewsService.generateQuestions(dto, userId);
  }

  @Get('application/:applicationId')
  @ApiOperation({
    summary: 'Lấy bộ câu hỏi phỏng vấn theo mã đơn ứng tuyển (applicationId)',
  })
  @ApiParam({ name: 'applicationId', description: 'Mã ObjectId của đơn ứng tuyển' })
  @ApiResponse({ status: 200, description: 'Bộ câu hỏi phỏng vấn' })
  async getByApplicationId(@Param('applicationId') applicationId: string) {
    return this.interviewsService.getQuestionsByApplicationId(applicationId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy bộ câu hỏi phỏng vấn theo mã tài liệu phỏng vấn (interviewId)',
  })
  @ApiParam({ name: 'id', description: 'Mã ObjectId của bộ câu hỏi' })
  @ApiResponse({ status: 200, description: 'Chi tiết bộ câu hỏi' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bộ câu hỏi' })
  async getById(@Param('id') id: string) {
    return this.interviewsService.getQuestionsById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Chỉnh sửa bộ câu hỏi phỏng vấn (Human-in-the-loop) [FR-INT-02]',
    description: 'Cho phép nhà tuyển dụng thêm, sửa, xóa, ghi chú hoặc chấm điểm trực tiếp từng câu hỏi.',
  })
  @ApiParam({ name: 'id', description: 'Mã ObjectId của bộ câu hỏi' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async updateQuestions(
    @Param('id') id: string,
    @Body() dto: UpdateInterviewQuestionsDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?._id;
    return this.interviewsService.updateQuestions(id, dto, userId);
  }

  @Post(':id/export')
  @ApiOperation({
    summary: 'Xuất phiếu phỏng vấn đa định dạng (Markdown / Plain Text / JSON) [FR-INT-03]',
    description: 'Tạo phiếu câu hỏi phỏng vấn sẵn sàng in hoặc gửi cho người phỏng vấn chuyên môn.',
  })
  @ApiParam({ name: 'id', description: 'Mã ObjectId của bộ câu hỏi' })
  @ApiResponse({ status: 200, description: 'Xuất phiếu phỏng vấn thành công' })
  async exportQuestions(
    @Param('id') id: string,
    @Body() dto: ExportInterviewDto,
  ) {
    return this.interviewsService.exportQuestions(id, dto.format || 'markdown');
  }

  @Get('question-bank/templates')
  @ApiOperation({
    summary: 'Tra cứu câu hỏi mẫu từ Ngân hàng câu hỏi chuyên môn (Domain Question Bank)',
    description: 'Truy xuất các câu hỏi chuẩn STAR hoặc Technical Deep Dive dựa trên kỹ năng.',
  })
  @ApiQuery({ name: 'skills', required: false, description: 'Danh sách kỹ năng phân cách bởi dấu phẩy (VD: NestJS,Docker)' })
  @ApiQuery({ name: 'category', required: false, enum: ['CLARIFICATION', 'TECHNICAL_DEEP_DIVE', 'SKILL_GAP', 'BEHAVIORAL_STAR'] })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng câu hỏi mẫu tối đa' })
  @ApiResponse({ status: 200, description: 'Danh sách câu hỏi mẫu' })
  async searchTemplates(
    @Query('skills') skills?: string,
    @Query('category') category?: InterviewCategory,
    @Query('limit') limit?: number,
  ) {
    const skillsList = skills ? skills.split(',').map((s) => s.trim()) : [];
    const categories = category ? [category] : undefined;
    return this.questionBankService.retrieveRelevantTemplates({
      skills: skillsList,
      categories,
      topK: limit || 10,
    });
  }
}
