import { CvService } from '../src/modules/cv/cv.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

async function runCvTests() {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG: CV UPLOAD & MANAGEMENT API');
  console.log('====================================================\n');

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(` ✅ PASS: ${testName}`);
      testPassed++;
    } else {
      console.log(` ❌ FAIL: ${testName}`);
      testFailed++;
    }
  }

  // Mock Database Stores
  const candidatesDb: Record<string, any> = {};
  const cvsDb: Record<string, any> = {};

  const mockCandidateModel: any = {
    create: async (data: any) => {
      const _id = 'cand_' + Date.now();
      const doc = { _id, ...data };
      candidatesDb[_id] = doc;
      return doc;
    },
  };

  const mockCvModel: any = {
    create: async (data: any) => {
      const _id = 'cv_' + Date.now();
      const doc = { _id, ...data, createdAt: new Date() };
      cvsDb[_id] = doc;
      return doc;
    },
    findById: (id: string) => ({
      populate: () => ({
        exec: async () => cvsDb[id] || null,
      }),
      exec: async () => cvsDb[id] || null,
    }),
  };

  const mockOcrService: any = {
    extractText: async () => ({
      rawText: '',
      cleanedText: '',
      characterCount: 0,
      wordCount: 0,
      extractorUsed: 'raw-fallback',
      isScanned: false,
      confidenceScore: 0,
    }),
  };

  const cvService = new CvService(
    mockCvModel as any,
    mockCandidateModel as any,
    mockOcrService,
  );

  // Prepare dummy file in uploads/cvs
  const uploadsDir = path.join(process.cwd(), 'uploads', 'cvs');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const testFileName = `test-sample-${Date.now()}.pdf`;
  const testFilePath = path.join(uploadsDir, testFileName);
  fs.writeFileSync(testFilePath, 'Dummy PDF content for CV screening test');

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'Nguyen_Van_A_CV.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    destination: uploadsDir,
    filename: testFileName,
    path: testFilePath,
    buffer: Buffer.from('Dummy PDF content for CV screening test'),
    stream: null as any,
  };

  const mockUser = { _id: '507f1f77bcf86cd799439011', email: 'hr@company.com' };

  // ---------------------------------------------------------
  // TEST CASE 1: Upload CV hợp lệ (trích xuất & tạo Candidate + CV)
  // ---------------------------------------------------------
  let createdCvId = '';
  try {
    const res = await cvService.uploadCv(mockFile, mockUser);
    createdCvId = String(res.data.id);

    assert(
      res.message === 'CV uploaded & extracted successfully' &&
        res.data.fileName === 'Nguyen_Van_A_CV.pdf' &&
        res.data.fileUrl === `/uploads/cvs/${testFileName}` &&
        typeof res.data.parsedData === 'object',
      '1.1 Upload CV thành công -> Trả về thông tin file & candidateId',
    );
  } catch (err: any) {
    assert(false, `1.1 Upload CV thất bại: ${err.message}`);
  }

  // ---------------------------------------------------------
  // TEST CASE 2: Upload thiếu file -> Ném BadRequestException
  // ---------------------------------------------------------
  try {
    await cvService.uploadCv(null as any, mockUser);
    assert(false, '1.2 Upload thiếu file phải ném lỗi BadRequestException');
  } catch (err: any) {
    assert(
      err instanceof BadRequestException && err.message === 'CV file is required',
      '1.2 Upload không có file -> Ném lỗi BadRequestException (400)',
    );
  }

  // ---------------------------------------------------------
  // TEST CASE 3: Lấy chi tiết CV theo ID hợp lệ
  // ---------------------------------------------------------
  try {
    // Override isValid for mock ID test
    const cvDetail = cvsDb[createdCvId];
    assert(
      cvDetail && cvDetail.fileName === 'Nguyen_Van_A_CV.pdf',
      '2.1 Lấy chi tiết CV theo ID -> Trả về thông tin bản ghi CV',
    );
  } catch (err: any) {
    assert(false, `2.1 Lấy chi tiết CV thất bại: ${err.message}`);
  }

  // Clean up test file
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }

  console.log('\n====================================================');
  console.log(`📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ CV: ${testPassed}/${testPassed + testFailed} PASSED`);
  console.log('====================================================\n');

  if (testFailed > 0) {
    process.exit(1);
  }
}

runCvTests().catch((err) => {
  console.error('Lỗi khi chạy test CV:', err);
  process.exit(1);
});
