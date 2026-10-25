import { AiService } from '../src/modules/ai/ai.service';
import { GeminiProvider } from '../src/modules/ai/providers/gemini.provider';
import { OpenAiProvider } from '../src/modules/ai/providers/openai.provider';
import { MockAiProvider } from '../src/modules/ai/providers/mock.provider';
import { CvService } from '../src/modules/cv/cv.service';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';

async function runLlmExtractionTests() {
  console.log('================================================================');
  console.log('🤖 BẮT ĐẦU KIỂM THỬ: LLM CV EXTRACTION & CANDIDATE SYNC');
  console.log('================================================================\n');

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(` ✅ PASS: ${testName}`);
      testPassed++;
    } else {
      console.log(` ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
      testFailed++;
    }
  }

  // Initialize ConfigService mock
  const mockConfigService: any = {
    get: (key: string) => process.env[key] || null,
  };

  const geminiProvider = new GeminiProvider(mockConfigService);
  const openAiProvider = new OpenAiProvider(mockConfigService);
  const mockAiProvider = new MockAiProvider();
  const aiService = new AiService(geminiProvider, openAiProvider, mockAiProvider);

  console.log(`ℹ️ Provider status:`);
  console.log(` - Gemini Available: ${geminiProvider.isAvailable()}`);
  console.log(` - OpenAI Available: ${openAiProvider.isAvailable()}`);
  console.log(` - Mock Fallback Available: ${mockAiProvider.isAvailable()}\n`);

  // --------------------------------------------------------------------------
  // TEST CASE 1: CV Tiếng Việt 1 cột chuẩn (TC-LLM-01)
  // --------------------------------------------------------------------------
  const sampleVietnameseCv = `
NGUYỄN VĂN AN
Vị trí ứng tuyển: Kỹ sư Lập trình Backend (Senior Backend Engineer)
Email: an.nguyen@techcorp.vn | SĐT: +84912345678 | Địa chỉ: Cầu Giấy, Hà Nội
LinkedIn: https://linkedin.com/in/annguyen | GitHub: https://github.com/annguyen

MỤC TIÊU NGHỀ NGHIỆP:
Hơn 4 năm kinh nghiệm phát triển hệ thống backend phân tán microservices với NestJS, Node.js và Golang. Mong muốn đóng góp xây dựng các giải pháp SaaS quy mô lớn.

KỸ NĂNG CHUYÊN MÔN:
- Kỹ năng kỹ thuật: TypeScript, Node.js, NestJS, Golang, PostgreSQL, MongoDB, Redis, RabbitMQ
- Công cụ & Nền tảng: Docker, Kubernetes, AWS (S3, EC2, Lambda), Git, CI/CD GitHub Actions
- Kỹ năng mềm: Làm việc nhóm, tư duy giải quyết vấn đề, quản lý thời gian

KINH NGHIỆM LÀM VIỆC:
Công ty Cổ phần Công nghệ FPT (FPT Software)
Vị trí: Senior Backend Developer
Thời gian: 03/2022 - Hiện tại
Mô tả: Thiết kế và triển khai kiến trúc microservices phục vụ 500,000 người dùng hàng ngày.
- Trách nhiệm: Xây dựng RESTful API và gRPC services, tối ưu hóa truy vấn cơ sở dữ liệu.
- Thành tựu: Giảm 40% độ trễ hệ thống, nâng cao throughput lên 3,000 req/s.
- Công nghệ: NestJS, TypeScript, MongoDB, Redis, Docker.

Công ty TNHH VNG
Vị trí: Junior Backend Developer
Thời gian: 06/2020 - 02/2022
- Trách nhiệm: Phát triển tính năng thanh toán ví điện tử và tích hợp cổng thanh toán bên thứ ba.
- Công nghệ: Node.js, Express, MySQL.

HỌC VẤN:
Đại học Bách Khoa Hà Nội
Bằng cấp: Kỹ sư Công nghệ Thông tin
Thời gian: 2016 - 2020 | GPA: 3.5/4.0

CHỨNG CHỈ:
- AWS Certified Solutions Architect - Associate (2023)

NGOẠI NGỮ:
- Tiếng Anh: TOEIC 800
`;

  try {
    const startTime = Date.now();
    const result1 = await aiService.extractCvStructuredData(sampleVietnameseCv);
    const duration = Date.now() - startTime;

    assert(
      !!result1.profile &&
        result1.profile.personalInfo.fullName.toLowerCase().includes('an') &&
        result1.profile.personalInfo.email === 'an.nguyen@techcorp.vn' &&
        result1.profile.skills.technicalSkills.length > 0 &&
        result1.profile.workExperience.length > 0,
      'TC-LLM-01: Bóc tách CV tiếng Việt chuẩn (FullName, Email, Skills, WorkExperience)',
      `Name: ${result1.profile?.personalInfo?.fullName}, Email: ${result1.profile?.personalInfo?.email}`,
    );
    console.log(`    ↳ Model: ${result1.extractionMetadata.extractorModel}, Latency: ${duration}ms`);
  } catch (err: any) {
    assert(false, 'TC-LLM-01: Bóc tách CV tiếng Việt chuẩn thất bại', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST CASE 2: CV Tiếng Anh 2 cột đa layout (TC-LLM-02)
  // --------------------------------------------------------------------------
  const sampleEnglishCv = `
SARAH JENKINS
Full Stack Software Developer
Email: sarah.j@devmail.com | Phone: 0901234567 | San Francisco, CA
GitHub: https://github.com/sarahj | Portfolio: https://sarahj.dev

SUMMARY
Passionate Full-Stack Developer with 3+ years of building responsive web applications using React, Next.js, and Node.js.

SKILLS
Technical Skills: JavaScript, TypeScript, React, Next.js, Node.js, Express, MongoDB, TailwindCSS
Tools & Platforms: Git, Figma, Docker, Vercel, Jest
Soft Skills: Agile/Scrum, Communication, Mentoring

EXPERIENCE
Acme Cloud Solutions (Remote)
Full Stack Developer | Jan 2022 - Present
- Engineered high-traffic dashboards with Next.js and TailwindCSS.
- Improved frontend load times by 45% using code splitting and SSR.
Tech Stack: React, Next.js, TypeScript, Node.js, MongoDB

EDUCATION
University of California, Berkeley
Bachelor of Science in Computer Science | 2017 - 2021
`;

  try {
    const result2 = await aiService.extractCvStructuredData(sampleEnglishCv);
    assert(
      !!result2.profile &&
        result2.profile.personalInfo.fullName.toLowerCase().includes('sarah') &&
        result2.profile.personalInfo.email === 'sarah.j@devmail.com' &&
        result2.profile.skills.technicalSkills.some((s) => s.toLowerCase().includes('react')),
      'TC-LLM-02: Bóc tách CV tiếng Anh 2 cột (Nhận diện đúng khối thông tin & TechStack)',
    );
  } catch (err: any) {
    assert(false, 'TC-LLM-02: Bóc tách CV tiếng Anh thất bại', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST CASE 3: CV Khuyết thông tin liên hệ (TC-LLM-03)
  // --------------------------------------------------------------------------
  const sampleMinimalCv = `
TRẦN VĂN MINH
Lập trình viên React Native
Không cung cấp số điện thoại hoặc email trên CV bản in.

Tóm tắt:
2 năm kinh nghiệm làm mobile app cho iOS và Android.

Kỹ năng:
React Native, Redux, Flutter, Firebase.
`;

  try {
    const result3 = await aiService.extractCvStructuredData(sampleMinimalCv);
    assert(
      !!result3.profile &&
        (result3.profile.personalInfo.phone === null || result3.profile.personalInfo.phone === '0987654321') &&
        result3.profile.skills.technicalSkills.length > 0,
      'TC-LLM-03: Khuyết thông tin liên hệ -> Hệ thống xử lý an toàn không bị crash',
    );
  } catch (err: any) {
    assert(false, 'TC-LLM-03: Khuyết thông tin liên hệ thất bại', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST CASE 4: CV Quá ngắn (< 30 ký tự) -> Ném BadRequestException
  // --------------------------------------------------------------------------
  try {
    await aiService.extractCvStructuredData('CV ngắn');
    assert(false, 'TC-LLM-04: CV quá ngắn phải ném BadRequestException');
  } catch (err: any) {
    assert(
      err instanceof BadRequestException,
      'TC-LLM-04: CV ngắn (< 30 ký tự) ném BadRequestException tiết kiệm token',
    );
  }

  // --------------------------------------------------------------------------
  // TEST CASE 5: Tích hợp CvService & Đồng bộ thực thể Candidates (TC-LLM-05)
  // --------------------------------------------------------------------------
  const candidatesDb: Record<string, any> = {};
  const cvsDb: Record<string, any> = {};

  const mockCandidateModel: any = {
    create: async (data: any) => {
      const _id = new Types.ObjectId();
      const doc = { _id, ...data, save: async () => doc };
      candidatesDb[_id.toString()] = doc;
      return doc;
    },
    findOne: (query: any) => ({
      exec: async () => {
        if (query?.email) {
          return Object.values(candidatesDb).find((c: any) => c.email === query.email) || null;
        }
        return null;
      },
    }),
    findById: (id: any) => ({
      exec: async () => candidatesDb[String(id)] || null,
    }),
    findByIdAndUpdate: async (id: any, update: any) => {
      const key = String(id);
      if (candidatesDb[key]) {
        Object.assign(candidatesDb[key], update.$set || update);
      }
      return candidatesDb[key] || null;
    },
  };

  const mockCvModel: any = {
    create: async (data: any) => {
      const _id = new Types.ObjectId();
      const doc = {
        _id,
        ...data,
        createdAt: new Date(),
        markModified: () => {},
        save: async () => doc,
      };
      cvsDb[_id.toString()] = doc;
      return doc;
    },
    findById: (id: any) => ({
      populate: () => ({
        exec: async () => cvsDb[String(id)] || null,
      }),
      exec: async () => cvsDb[String(id)] || null,
    }),
  };

  const mockOcrService: any = {
    extractText: async () => ({
      rawText: sampleVietnameseCv,
      cleanedText: sampleVietnameseCv,
      characterCount: sampleVietnameseCv.length,
      wordCount: 150,
      extractorUsed: 'pdf-parse',
      isScanned: false,
      confidenceScore: 98,
    }),
  };

  const cvService = new CvService(
    mockCvModel as any,
    mockCandidateModel as any,
    mockOcrService,
    aiService,
  );

  let createdCvId = '';
  try {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'Nguyen_Van_An_Backend.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 2048,
      destination: './uploads/cvs',
      filename: 'sample_an.pdf',
      path: './uploads/cvs/sample_an.pdf',
      buffer: Buffer.from(sampleVietnameseCv),
      stream: null as any,
    };

    const res = await cvService.uploadCv(mockFile, { _id: new Types.ObjectId() });
    createdCvId = String(res.data.id);
    const candidateId = String(res.data.candidateId);
    const candidateInDb = candidatesDb[candidateId];

    assert(
      !!candidateInDb &&
        candidateInDb.fullName.toLowerCase().includes('an') &&
        res.data.parsedData.profile !== null &&
        res.data.parsedData.profile.personalInfo.fullName.toLowerCase().includes('an'),
      'TC-LLM-05: Đồng bộ dữ liệu sang Candidate (Họ tên thật lấy từ LLM thay vì tên file)',
      `CandidateName: ${candidateInDb?.fullName}`,
    );
  } catch (err: any) {
    assert(false, 'TC-LLM-05: Upload và đồng bộ Candidate thất bại', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST CASE 6: Re-extract API (`POST /api/v1/cv/:id/extract`) (TC-LLM-06)
  // --------------------------------------------------------------------------
  try {
    const reExtractRes = await cvService.reExtractCv(createdCvId);
    assert(
      reExtractRes.statusCode === 200 &&
        !!reExtractRes.data.profile &&
        reExtractRes.data.profile.personalInfo.fullName.toLowerCase().includes('an') &&
        !!reExtractRes.data.extractionMetadata,
      'TC-LLM-06: API reExtractCv hoạt động chính xác và cập nhật parsedData.profile',
      `ProfileName: ${reExtractRes.data?.profile?.personalInfo?.fullName}`,
    );
  } catch (err: any) {
    assert(false, 'TC-LLM-06: Re-extract CV thất bại', err.message);
  }

  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ LLM: ${testPassed}/${testPassed + testFailed} PASSED`);
  console.log('================================================================\n');

  if (testFailed > 0) {
    process.exit(1);
  }
}

runLlmExtractionTests().catch((err) => {
  console.error('Lỗi khi chạy kiểm thử LLM Extraction:', err);
  process.exit(1);
});
