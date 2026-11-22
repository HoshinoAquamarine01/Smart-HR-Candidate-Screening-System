import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  
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
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Smart HR API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 Smart HR API Server is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger OpenAPI Documentation is available at: http://localhost:${port}/api/docs`);
}
bootstrap();
