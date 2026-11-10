import { JobsService } from '../src/modules/jobs/jobs.service';
import { AiService } from '../src/modules/ai/ai.service';
import { GeminiProvider } from '../src/modules/ai/providers/gemini.provider';
import { OpenAiProvider } from '../src/modules/ai/providers/openai.provider';
import { MockAiProvider } from '../src/modules/ai/providers/mock.provider';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';

// ============================================================================
// MOCK MONGOOSE MODEL HELPER
// ============================================================================
function createMockJobsModel(initialStore: Map<string, any> = new Map()) {
  const store = initialStore;

  const mockModel: any = {
    store,
    find: (filter: any) => {
      let filtered = Array.from(store.values());
      if (filter.status) {
        filtered = filtered.filter((item) => item.status === filter.status);
      }
      if (filter.$or) {
        filtered = filtered.filter((item) =>
          filter.$or.some((cond: any) => {
            if (cond.title) return cond.title.test(item.title);
            if (cond.rawDescription) return cond.rawDescription.test(item.rawDescription);
            return false;
          }),
        );
      }
      return {
        sort: () => ({
          skip: (skipCount: number) => ({
            limit: (limitCount: number) => ({
              exec: async () => filtered.slice(skipCount, skipCount + limitCount).map(wrapDoc),
            }),
          }),
        }),
        exec: async () => filtered.map(wrapDoc),
      };
    },
    countDocuments: (filter: any) => ({
      exec: async () => {
        let count = 0;
        for (const item of store.values()) {
          let match = true;
          if (filter.status && item.status !== filter.status) match = false;
          if (filter.jobId && item.jobId?.toString() !== filter.jobId?.toString()) match = false;
          if (match) count++;
        }
        return count;
      },
    }),
    findById: (id: any) => {
      const key = id ? id.toString() : '';
      const doc = store.get(key) || null;
      return {
        exec: async () => (doc ? wrapDoc(doc) : null),
      };
    },
    create: async (data: any) => {
      const id = data._id || new Types.ObjectId();
      const newDoc = {
        _id: id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.set(id.toString(), newDoc);
      return wrapDoc(newDoc);
    },
    findByIdAndDelete: (id: any) => ({
      exec: async () => {
        const key = id ? id.toString() : '';
        const doc = store.get(key) || null;
        store.delete(key);
        return doc ? wrapDoc(doc) : null;
      },
    }),
  };

  function wrapDoc(data: any) {
    return {
      ...data,
      toObject: () => ({ ...data }),
      save: async function () {
        this.updatedAt = new Date();
        store.set(this._id.toString(), this);
        return this;
      },
    };
  }

  return mockModel;
}

function createMockApplicationsModel(appsStore: Map<string, any> = new Map()) {
  return {
    aggregate: async (pipeline: any[]) => {
      const results: any[] = [];
      const matchStage = pipeline.find((p) => p.$match);
      const groupStage = pipeline.find((p) => p.$group);

      if (groupStage?.$group?._id === '$candidateStatus') {
        const counts: Record<string, number> = {};
        for (const app of appsStore.values()) {
          const status = app.candidateStatus || 'NEW';
          counts[status] = (counts[status] || 0) + 1;
        }
        for (const [k, v] of Object.entries(counts)) {
          results.push({ _id: k, count: v });
        }
      } else if (groupStage?.$group?._id === '$jobId') {
        const counts: Record<string, number> = {};
        for (const app of appsStore.values()) {
          const jId = app.jobId?.toString();
          if (jId) counts[jId] = (counts[jId] || 0) + 1;
        }
        for (const [k, v] of Object.entries(counts)) {
          results.push({ _id: new Types.ObjectId(k), count: v });
        }
      }
      return results;
    },
    countDocuments: (filter: any) => ({
      exec: async () => {
        let count = 0;
        for (const app of appsStore.values()) {
          if (filter.jobId && app.jobId?.toString() === filter.jobId.toString()) {
            count++;
          }
        }
        return count;
      },
    }),
  };
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
async function runJobsModuleTests() {
  console.log('================================================================');
  console.log('🎯 BẮT ĐẦU KIỂM THỬ: JOBS MODULE & AI CRITERIA PARSER');
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

  const configService = new ConfigService({});
  const geminiProvider = new GeminiProvider(configService);
  const openaiProvider = new OpenAiProvider(configService);
  const mockAiProvider = new MockAiProvider();
  const aiService = new AiService(geminiProvider, openaiProvider, mockAiProvider);

  const jobsStore = new Map<string, any>();
  const appsStore = new Map<string, any>();

  const mockJobsModel = createMockJobsModel(jobsStore);
  const mockAppsModel = createMockApplicationsModel(appsStore);

  const jobsService = new JobsService(mockJobsModel, mockAppsModel as any, aiService);

  // --------------------------------------------------------------------------
  // TEST SUITE 1: AI JD PARSING & CRITERIA EXTRACTION
  // --------------------------------------------------------------------------
  console.log('--- 1. KIỂM THỬ AI JD PARSING (STANDALONE PREVIEW) ---');
  {
    const sampleJdText = `
Vị trí: Senior Backend Engineer (NestJS / Node.js)
Yêu cầu chuyên môn:
- Có từ 4 năm kinh nghiệm phát triển hệ thống backend bằng Node.js và TypeScript.
- Thành thạo framework NestJS, thiết kế REST API và microservices.
- Nắm vững cơ sở dữ liệu MongoDB và PostgreSQL.
- Ưu tiên ứng viên có kinh nghiệm với Docker, Kubernetes, Redis và AWS.
- Trách nhiệm: Thiết kế kiến trúc backend, tối ưu truy vấn database, hướng dẫn thành viên junior.
`;
    const previewResult = await jobsService.parseJd({
      rawDescription: sampleJdText,
      jobTitle: 'Senior Backend Engineer',
    });

    assert(!!previewResult.extractedCriteria, 'Trích xuất tiêu chí JD thành công');
    const criteria = previewResult.extractedCriteria;

    assert(criteria.requiredSkills.includes('NestJS') || criteria.requiredSkills.includes('Node.js'), 'Bóc tách đúng requiredSkills (NestJS / Node.js)');
    assert(criteria.preferredSkills.includes('Docker') || criteria.preferredSkills.includes('Redis'), 'Bóc tách đúng preferredSkills (Docker / Redis)');
    assert(criteria.minExperienceYears >= 3, 'Bóc tách đúng số năm kinh nghiệm tối thiểu >= 3 năm', `Actual: ${criteria.minExperienceYears}`);
    assert(criteria.seniorityLevel === 'SENIOR', 'Nhận diện đúng cấp bậc vị trí là SENIOR');
    assert(criteria.responsibilities.length >= 2, 'Trích xuất đầy đủ danh sách trách nhiệm công việc');

    // Check suggested weights for Senior
    assert(
      previewResult.suggestedWeights.w_exp >= 0.35,
      'Gợi ý trọng số cho Senior ưu tiên kinh nghiệm thực chiến (w_exp >= 0.35)',
    );
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 2: JOB CREATION & VECTOR EMBEDDING
  // --------------------------------------------------------------------------
  console.log('\n--- 2. KIỂM THỬ TẠO TIN TUYỂN DỤNG & SINH VECTOR EMBEDDING ---');
  let createdJobId: string;
  {
    const newJob = await jobsService.create({
      title: 'Senior Fullstack Engineer (React / NestJS)',
      department: 'Platform Engineering',
      location: 'Hồ Chí Minh / Hybrid',
      employmentType: 'FULL_TIME',
      rawDescription: `
Tuyển dụng Senior Fullstack Engineer có tối thiểu 4 năm kinh nghiệm.
Yêu cầu: Thành thạo React, TypeScript, NestJS, MongoDB.
Ưu tiên: Docker, Kubernetes, CI/CD.
`,
      status: 'PUBLISHED',
    });

    assert(!!newJob._id, 'Lưu tin tuyển dụng vào CSDL thành công');
    createdJobId = newJob._id.toString();

    assert(newJob.title === 'Senior Fullstack Engineer (React / NestJS)', 'Lưu đúng tiêu đề công việc');
    assert(newJob.status === 'PUBLISHED', 'Trạng thái mặc định là PUBLISHED');
    assert(Array.isArray(newJob.extractedCriteria.requiredSkills), 'Có mảng requiredSkills được trích xuất');
    assert(newJob.extractedCriteria.requiredSkills.length > 0, 'requiredSkills không rỗng');

    // Check weights normalization
    const weights = newJob.scoringWeights;
    const sumWeights = weights.w_skill + weights.w_exp + weights.w_edu + weights.w_semantic;
    assert(Math.abs(sumWeights - 1.0) < 0.05, 'Tổng 4 trọng số chuẩn hóa xấp xỉ 1.0', `Sum: ${sumWeights}`);

    // Check embedding
    assert(Array.isArray(newJob.embedding) && newJob.embedding.length > 0, 'Tự động tạo vector embedding đặc trưng cho JD');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 3: LISTING & PAGINATION WITH APPLICANT COUNT
  // --------------------------------------------------------------------------
  console.log('\n--- 3. KIỂM THỬ DANH SÁCH & PHÂN TRANG KÈM SỐ LƯỢNG ỨNG VIÊN ---');
  {
    // Create another draft job
    await jobsService.create({
      title: 'Junior Frontend Developer',
      department: 'UI Team',
      rawDescription: 'Tuyển dụng Junior Frontend có 1 năm kinh nghiệm với HTML, CSS, JavaScript, React.',
      status: 'DRAFT',
    });

    // Add mock applications for the first job
    const firstJobObjectId = new Types.ObjectId(createdJobId);
    appsStore.set('app-1', { jobId: firstJobObjectId, candidateStatus: 'NEW' });
    appsStore.set('app-2', { jobId: firstJobObjectId, candidateStatus: 'INTERVIEW' });
    appsStore.set('app-3', { jobId: firstJobObjectId, candidateStatus: 'HIRED' });

    const listResult = await jobsService.findAll({ page: 1, limit: 10 });
    assert(listResult.total >= 2, 'Lấy danh sách tất cả tin tuyển dụng');
    assert(listResult.items.length >= 2, 'Phân trang trả về đúng số bản ghi');

    const firstJobInList = listResult.items.find((j: any) => j._id.toString() === createdJobId);
    assert(firstJobInList?.applicantCount === 3, 'Đính kèm chính xác số lượng hồ sơ ứng tuyển (applicantCount = 3)');

    // Filter by status
    const publishedList = await jobsService.findAll({ status: 'PUBLISHED' });
    assert(publishedList.items.every((j: any) => j.status === 'PUBLISHED'), 'Lọc chính xác theo trạng thái PUBLISHED');

    // Filter by search keyword
    const searchList = await jobsService.findAll({ search: 'Frontend' });
    assert(searchList.items.some((j: any) => j.title.includes('Frontend')), 'Tìm kiếm chính xác theo từ khóa trong tiêu đề');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 4: SINGLE JOB DETAILS & PIPELINE AGGREGATION
  // --------------------------------------------------------------------------
  console.log('\n--- 4. KIỂM THỬ XEM CHI TIẾT & THỐNG KÊ PHỄU ỨNG VIÊN ---');
  {
    const jobDetail = await jobsService.findOne(createdJobId);
    assert(jobDetail._id.toString() === createdJobId, 'Lấy đúng chi tiết Job theo ID');
    assert(jobDetail.applicantStats.total === 3, 'Thống kê tổng số 3 ứng viên');
    assert(jobDetail.applicantStats.byStatus.NEW === 1, 'Thống kê chính xác trạng thái NEW = 1');
    assert(jobDetail.applicantStats.byStatus.INTERVIEW === 1, 'Thống kê chính xác trạng thái INTERVIEW = 1');
    assert(jobDetail.applicantStats.byStatus.HIRED === 1, 'Thống kê chính xác trạng thái HIRED = 1');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 5: UPDATE JOB & STATUS TRANSITION
  // --------------------------------------------------------------------------
  console.log('\n--- 5. KIỂM THỬ CẬP NHẬT TIN TUYỂN DỤNG & ĐỔI TRẠNG THÁI ---');
  {
    const updated = await jobsService.update(createdJobId, {
      title: 'Lead Fullstack Architect (React / NestJS)',
      location: 'Hà Nội & TP. Hồ Chí Minh',
    });
    assert(updated.title === 'Lead Fullstack Architect (React / NestJS)', 'Cập nhật tiêu đề thành công');
    assert(updated.location === 'Hà Nội & TP. Hồ Chí Minh', 'Cập nhật địa điểm làm việc thành công');

    // Status transition
    const statusResult = await jobsService.updateStatus(createdJobId, 'CLOSED');
    assert(statusResult.status === 'CLOSED', 'Đổi trạng thái sang CLOSED thành công');

    const jobAfterStatus = await jobsService.findOne(createdJobId);
    assert(jobAfterStatus.status === 'CLOSED', 'Xác nhận trạng thái trong CSDL là CLOSED');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 6: DELETE / ARCHIVE PROTECTION
  // --------------------------------------------------------------------------
  console.log('\n--- 6. KIỂM THỬ XÓA & BẢO TOÀN DỮ LIỆU KHI ĐÃ CÓ ỨNG VIÊN ---');
  {
    // Try deleting job with 3 applicants -> Soft close
    const removeWithApps = await jobsService.remove(createdJobId);
    assert(removeWithApps.status === 'CLOSED', 'Không xóa vĩnh viễn tin tuyển dụng đã có ứng viên, tự động chuyển sang CLOSED để bảo vệ dữ liệu');

    // Create an empty job with 0 applicants and delete -> Hard delete
    const emptyJob = await jobsService.create({
      title: 'Temp DevOps Engineer',
      rawDescription: 'Vị trí tạm thời yêu cầu Docker, Kubernetes, Terraform.',
    });
    const emptyJobId = emptyJob._id.toString();

    const removeEmpty = await jobsService.remove(emptyJobId);
    assert(removeEmpty.message.includes('xóa tin tuyển dụng thành công'), 'Xóa vĩnh viễn tin tuyển dụng chưa có ứng viên nào nộp');

    let notFoundError = false;
    try {
      await jobsService.findOne(emptyJobId);
    } catch (e: any) {
      notFoundError = true;
    }
    assert(notFoundError, 'Tin tuyển dụng sau khi xóa không còn tồn tại trong CSDL');
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT KIỂM THỬ: ${testPassed} PASS / ${testFailed} FAIL`);
  if (testFailed === 0) {
    console.log('🎉 TẤT CẢ TEST CASES CỦA JOBS MODULE ĐÃ VƯỢT QUA 100%!');
  } else {
    console.log('⚠️ CÓ TEST CASE BỊ LỖI, VUI LÒNG KIỂM TRA LẠI LOG CHI TIẾT Ở TRÊN!');
  }
  console.log('================================================================\n');

  if (testFailed > 0) {
    process.exit(1);
  }
}

runJobsModuleTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

