import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { CvService } from './cv.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const uploadsDir = join(process.cwd(), 'uploads', 'cvs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const cvMulterOptions = {
  storage: diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/png',
      'image/jpeg',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          'Invalid file type. Only PDF, DOCX, DOC, PNG, and JPEG files are allowed.',
        ),
        false,
      );
    }
  },
};

@ApiTags('CV & Extraction')
@Controller('api/v1/cv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('file', cvMulterOptions))
  @ApiOperation({
    summary: 'Tải lên tài liệu CV (PDF/DOCX/PNG) & tự động kích hoạt OCR + LLM Extraction [FR-CV-01]',
    description: 'Nhận tệp CV từ ứng viên hoặc nhà tuyển dụng, lưu trữ và đưa vào tiến trình trích xuất văn bản thô (Tesseract OCR) và LLM parsing ra cấu trúc JSON chuẩn.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Tệp CV định dạng PDF, DOCX, DOC hoặc ảnh PNG/JPEG (Tối đa 5MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Tải lên CV và trích xuất thành công' })
  @ApiResponse({ status: 400, description: 'Tệp không hợp lệ hoặc kích thước vượt quá 5MB' })
  async uploadCv(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.cvService.uploadCv(file, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy dữ liệu CV đã bóc tách cấu trúc [FR-CV-02]',
    description: 'Trả về thông tin cá nhân, kỹ năng technical/soft, lịch sử kinh nghiệm làm việc, học vấn và các dự án của ứng viên.',
  })
  @ApiParam({ name: 'id', description: 'Mã ObjectId của hồ sơ CV' })
  @ApiResponse({ status: 200, description: 'Chi tiết hồ sơ CV bóc tách' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hồ sơ CV' })
  async getCvById(@Param('id') id: string) {
    return this.cvService.getCvById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/extract')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Yêu cầu AI trích xuất lại cấu trúc CV (Re-extract)',
    description: 'Chạy lại pipeline OCR và LLM parser cho hồ sơ CV đã lưu nếu trước đó xảy ra lỗi.',
  })
  @ApiParam({ name: 'id', description: 'Mã ObjectId của hồ sơ CV' })
  @ApiResponse({ status: 200, description: 'Trích xuất lại thành công' })
  async reExtractCv(@Param('id') id: string) {
    return this.cvService.reExtractCv(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/file')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tải xuống hoặc xem trực tuyến file CV gốc',
  })
  @ApiParam({ name: 'id', description: 'Mã ObjectId của hồ sơ CV' })
  @ApiResponse({ status: 200, description: 'Dòng stream file nhị phân' })
  async getCvFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, fileName, mimeType } = await this.cvService.getCvFile(id);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
    });
    return new StreamableFile(stream);
  }
}
