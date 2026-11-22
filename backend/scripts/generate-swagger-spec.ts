import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';

async function generateSwagger() {
  console.log('Generating OpenAPI 3.0 specification from NestJS modules...');
  let app: any;
  try {
    app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  } catch (initErr: any) {
    console.error('❌ Failed during NestFactory.create:', initErr);
    process.exit(1);
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Smart HR & Candidate Screening System API')
    .setDescription(
      'Nền tảng tuyển dụng thông minh: Sàng lọc hồ sơ ứng viên tự động (AI Hybrid Scoring) & Sinh bộ câu hỏi phỏng vấn thích ứng (RAG Engine).\n\n' +
        '**Quy chuẩn xác thực**: Đối với các endpoint yêu cầu xác thực, truyền Bearer Token qua header `Authorization: Bearer <access_token>`.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT Authorization',
        description: 'Nhập JWT Access Token nhận được từ API /api/v1/auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'Xác thực tài khoản, đăng ký, đăng nhập & phân quyền JWT')
    .addTag('Users', 'Quản lý thông tin tài khoản người dùng')
    .addTag('Jobs', 'Quản lý tin tuyển dụng & AI bóc tách tiêu chí Job Description [FR-JOB-01..03]')
    .addTag('CV & Extraction', 'Tải lên tài liệu CV, trích xuất OCR văn bản thô & bóc tách cấu trúc LLM [FR-CV-01..02]')
    .addTag('Candidate Screening & Matching', 'Đối soát tiêu chí CV - JD, Semantic Matching & Xếp hạng ứng viên [FR-SCR-01..02]')
    .addTag('Candidates', 'Quản lý hồ sơ ứng viên 360°, bộ lọc đa chiều & bảo vệ quyền riêng tư [FR-CAN-01..03]')
    .addTag('Applications & Kanban', 'Quản lý đơn ứng tuyển, chu trình Kanban 7 bước & nhật ký quyết định tuyển dụng [FR-CAND-03], [FR-PIP-01]')
    .addTag('AI Interview Generation', 'Khởi tạo bộ câu hỏi phỏng vấn thích ứng theo kiến trúc RAG & Rubric đánh giá STAR [FR-INT-01..03]')
    .addTag('Recruitment Analytics', 'Báo cáo & Thống kê tuyển dụng Dashboard, phân vị điểm số & khoảng cách kỹ năng [FR-REP-01]')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const outDir = path.resolve(__dirname, '../../docs/swagger');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFilePath = path.join(outDir, 'swagger.json');
  fs.writeFileSync(outFilePath, JSON.stringify(document, null, 2), 'utf-8');
  console.log(`✅ OpenAPI Swagger JSON generated successfully at: ${outFilePath}`);

  await app.close();
}

generateSwagger().catch((err) => {
  console.error('Error generating Swagger spec:', err);
  process.exit(1);
});
