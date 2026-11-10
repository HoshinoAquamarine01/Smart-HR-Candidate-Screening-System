/**
 * Unit & Integration Test Suite for ApplicationsModule & Kanban Drag-and-Drop
 * Requirements: [FR-CAND-03], [FR-PIP-01]
 *
 * Covers:
 * 1. Application Creation & Deduplication Check (Single application per job)
 * 2. Kanban Status Transitions (PATCH /api/v1/applications/:id/status)
 *    NEW -> SCREENING -> SHORTLISTED -> INTERVIEW -> OFFER -> HIRED / REJECTED
 * 3. Full Audit History tracking in recruiterDecision.history
 * 4. Kanban Board Aggregator (GET /api/v1/applications/kanban)
 * 5. Multi-faceted Search, Filter & Pagination (jobId, candidateId, status, minScore, search)
 * 6. Single Application 360° Query with Populated Relations
 * 7. Cascade Deletion with Screening Results cleanup
 */

import { Types } from 'mongoose';
import { ApplicationsService } from '../src/modules/applications/applications.service';
import {
  CandidateStatus,
  AiPipelineStatus,
} from '../src/schemas/applications.schema';

// ============================================================================
// IN-MEMORY MOCK MONGOOSE STORES & MODELS (TEST SCOPE ONLY)
// ============================================================================

function createMockApplicationsModel(
  store: Map<string, any>,
  candidatesStore?: Map<string, any>,
  jobsStore?: Map<string, any>,
  cvsStore?: Map<string, any>,
) {
  function populateDoc(data: any) {
    const cand = candidatesStore?.get(data.candidateId?.toString()) || data.candidateId;
    const job = jobsStore?.get(data.jobId?.toString()) || data.jobId;
    const cv = cvsStore?.get(data.cvId?.toString()) || data.cvId;
    return {
      ...data,
      candidateId: cand,
      jobId: job,
      cvId: cv,
      save: async function () {
        this.updatedAt = new Date();
        store.set(this._id.toString(), this);
        return this;
      },
    };
  }

  return {
    store,
    find: (filter: any) => {
      let filtered = Array.from(store.values());

      if (filter.jobId) {
        filtered = filtered.filter(
          (a) => a.jobId?.toString() === filter.jobId.toString(),
        );
      }
      if (filter.candidateId?.$in) {
        const idStrs = new Set(
          filter.candidateId.$in.map((id: any) => id.toString()),
        );
        filtered = filtered.filter((a) => idStrs.has(a.candidateId?.toString()));
      } else if (filter.candidateId) {
        filtered = filtered.filter(
          (a) => a.candidateId?.toString() === filter.candidateId.toString(),
        );
      }
      if (filter.candidateStatus) {
        filtered = filtered.filter(
          (a) => a.candidateStatus === filter.candidateStatus,
        );
      }
      if (filter.aiPipelineStatus) {
        filtered = filtered.filter(
          (a) => a.aiPipelineStatus === filter.aiPipelineStatus,
        );
      }

      return {
        populate: () => ({
          populate: () => ({
            populate: () => ({
              sort: () => ({
                skip: (s: number) => ({
                  limit: (l: number) => ({
                    exec: async () => filtered.slice(s, s + l).map(populateDoc),
                  }),
                }),
                exec: async () => filtered.map(populateDoc),
              }),
            }),
            sort: () => ({
              skip: (s: number) => ({
                limit: (l: number) => ({
                  exec: async () => filtered.slice(s, s + l).map(populateDoc),
                }),
              }),
              exec: async () => filtered.map(populateDoc),
            }),
          }),
        }),
        sort: () => ({
          exec: async () => filtered.map(populateDoc),
        }),
        exec: async () => filtered.map(populateDoc),
      };
    },
    countDocuments: (filter: any) => ({
      exec: async () => {
        let count = 0;
        for (const item of store.values()) {
          let match = true;
          if (filter.jobId && item.jobId?.toString() !== filter.jobId.toString())
            match = false;
          if (
            filter.candidateStatus &&
            item.candidateStatus !== filter.candidateStatus
          )
            match = false;
          if (
            filter.candidateId?.$in &&
            !filter.candidateId.$in.some(
              (id: any) => id.toString() === item.candidateId?.toString(),
            )
          )
            match = false;
          if (match) count++;
        }
        return count;
      },
    }),
    findById: (id: any) => {
      const key = id ? id.toString() : '';
      const doc = store.get(key) || null;
      return {
        populate: () => ({
          populate: () => ({
            populate: () => ({
              exec: async () => (doc ? populateDoc(doc) : null),
            }),
            exec: async () => (doc ? populateDoc(doc) : null),
          }),
          exec: async () => (doc ? populateDoc(doc) : null),
        }),
        exec: async () => (doc ? wrapDoc(doc) : null),
      };
    },
    findOne: (query: any) => {
      let found: any = null;
      for (const item of store.values()) {
        let match = true;
        if (
          query.candidateId &&
          item.candidateId?.toString() !== query.candidateId.toString()
        )
          match = false;
        if (query.jobId && item.jobId?.toString() !== query.jobId.toString())
          match = false;
        if (match) {
          found = item;
          break;
        }
      }
      return {
        exec: async () => (found ? wrapDoc(found) : null),
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
      save: async function () {
        this.updatedAt = new Date();
        store.set(this._id.toString(), this);
        return this;
      },
    };
  }
}

function createMockCandidatesModel(store: Map<string, any>) {
  return {
    findById: (id: any) => ({
      exec: async () => store.get(id?.toString()) || null,
    }),
    find: (filter: any) => ({
      select: () => ({
        exec: async () => {
          const results: any[] = [];
          if (filter.$or) {
            const regexes = filter.$or.map((o: any) => o.fullName || o.email);
            for (const c of store.values()) {
              if (regexes.some((r: RegExp) => r.test(c.fullName) || r.test(c.email))) {
                results.push({ _id: c._id });
              }
            }
          }
          return results;
        },
      }),
    }),
  };
}

function createMockJobsModel(store: Map<string, any>) {
  return {
    findById: (id: any) => ({
      exec: async () => store.get(id?.toString()) || null,
    }),
  };
}

function createMockCvsModel(store: Map<string, any>) {
  return {
    findById: (id: any) => ({
      exec: async () => store.get(id?.toString()) || null,
    }),
  };
}

function createMockScreeningModel(store: Map<string, any>) {
  return {
    find: (filter: any) => {
      let filtered = Array.from(store.values());
      if (filter.applicationId?.$in) {
        const idStrs = new Set(
          filter.applicationId.$in.map((id: any) => id.toString()),
        );
        filtered = filtered.filter((s) =>
          idStrs.has(s.applicationId?.toString()),
        );
      }
      return {
        exec: async () => filtered,
      };
    },
    findOne: (filter: any) => {
      let found: any = null;
      for (const item of store.values()) {
        if (
          filter.applicationId &&
          item.applicationId?.toString() === filter.applicationId.toString()
        ) {
          found = item;
          break;
        }
      }
      return {
        exec: async () => found,
      };
    },
    deleteMany: (query: any) => ({
      exec: async () => {
        let deleted = 0;
        for (const [k, v] of store.entries()) {
          if (
            query.applicationId &&
            v.applicationId?.toString() === query.applicationId.toString()
          ) {
            store.delete(k);
            deleted++;
          }
        }
        return { deletedCount: deleted };
      },
    }),
  };
}

// ============================================================================
// MAIN TEST SUITE RUNNER
// ============================================================================
async function runApplicationsModuleTests() {
  console.log('================================================================');
  console.log('🎯 BẮT ĐẦU KIỂM THỬ: APPLICATIONS MODULE & KANBAN TRANSITIONS');
  console.log('   MÃ YÊU CẦU: [FR-CAND-03], [FR-PIP-01]');
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

  const appsStore = new Map<string, any>();
  const candidatesStore = new Map<string, any>();
  const jobsStore = new Map<string, any>();
  const cvsStore = new Map<string, any>();
  const screeningStore = new Map<string, any>();

  const mockAppsModel = createMockApplicationsModel(
    appsStore,
    candidatesStore,
    jobsStore,
    cvsStore,
  );
  const mockCandModel = createMockCandidatesModel(candidatesStore);
  const mockJobsModel = createMockJobsModel(jobsStore);
  const mockCvsModel = createMockCvsModel(cvsStore);
  const mockScreeningModel = createMockScreeningModel(screeningStore);

  const applicationsService = new ApplicationsService(
    mockAppsModel as any,
    mockCandModel as any,
    mockJobsModel as any,
    mockCvsModel as any,
    mockScreeningModel as any,
  );

  // Seed fixture entities
  const candidate1Id = new Types.ObjectId();
  candidatesStore.set(candidate1Id.toString(), {
    _id: candidate1Id,
    fullName: 'Hoàng Minh Tuấn',
    email: 'tuan.hoang@example.com',
    phone: '0988776655',
    currentTitle: 'Senior Fullstack Engineer',
    location: 'Hà Nội',
    anonymized: false,
  });

  const candidate2Id = new Types.ObjectId();
  candidatesStore.set(candidate2Id.toString(), {
    _id: candidate2Id,
    fullName: 'Đặng Ngọc Lan',
    email: 'lan.dang@example.com',
    phone: '0977112233',
    currentTitle: 'DevOps / Cloud Specialist',
    location: 'Hồ Chí Minh',
    anonymized: false,
  });

  const job1Id = new Types.ObjectId();
  jobsStore.set(job1Id.toString(), {
    _id: job1Id,
    title: 'Senior NestJS / TypeScript Backend Engineer',
    department: 'Engineering',
    location: 'Hà Nội / Hybrid',
    employmentType: 'FULL_TIME',
    status: 'PUBLISHED',
  });

  const cv1Id = new Types.ObjectId();
  cvsStore.set(cv1Id.toString(), {
    _id: cv1Id,
    fileName: 'Hoang_Minh_Tuan_CV.pdf',
    fileUrl: '/uploads/cvs/tuan_cv.pdf',
    fileSize: 124000,
  });

  const cv2Id = new Types.ObjectId();
  cvsStore.set(cv2Id.toString(), {
    _id: cv2Id,
    fileName: 'Dang_Ngoc_Lan_CV.pdf',
    fileUrl: '/uploads/cvs/lan_cv.pdf',
    fileSize: 156000,
  });

  // --------------------------------------------------------------------------
  // TEST SUITE 1: CREATE APPLICATION & DEDUPLICATION CHECK
  // --------------------------------------------------------------------------
  console.log('--- 1. KIỂM THỬ NỘP HỒ SƠ & KHỬ TRÙNG LẶP ĐƠN ỨNG TUYỂN ---');
  let app1Id: string;
  {
    const app1 = await applicationsService.create({
      candidateId: candidate1Id.toString(),
      jobId: job1Id.toString(),
      cvId: cv1Id.toString(),
    });

    assert(!!app1._id, 'Nộp đơn ứng tuyển thành công');
    app1Id = app1._id.toString();
    assert(
      app1.candidateStatus === CandidateStatus.NEW,
      'Trạng thái mặc định ban đầu là NEW (Hồ sơ mới)',
    );
    assert(
      app1.aiPipelineStatus === AiPipelineStatus.UPLOADED,
      'Trạng thái xử lý AI ban đầu là UPLOADED',
    );

    // Deduplication check: Candidate cannot apply twice to the same job
    const duplicateApp = await applicationsService.create({
      candidateId: candidate1Id.toString(),
      jobId: job1Id.toString(),
      cvId: cv1Id.toString(),
    });
    assert(
      duplicateApp._id.toString() === app1Id,
      'Khử trùng lặp: Trả về đơn ứng tuyển hiện hữu khi nộp trùng jobId',
    );
    assert(appsStore.size === 1, 'Số lượng đơn ứng tuyển trong CSDL không bị nhân bản rác');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 2: KANBAN DRAG-AND-DROP STATUS TRANSITIONS [FR-CAND-03]
  // --------------------------------------------------------------------------
  console.log('\n--- 2. KIỂM THỬ KANBAN DRAG-AND-DROP STATUS TRANSITIONS (PATCH /api/v1/applications/:id/status) ---');
  {
    // 2.1 Drag NEW -> SCREENING
    const step1 = await applicationsService.updateStatus(app1Id, {
      status: CandidateStatus.SCREENING,
      note: 'Hệ thống AI bắt đầu chấm điểm hồ sơ tự động',
      decidedBy: 'AI Worker',
    });
    assert(step1.candidateStatus === CandidateStatus.SCREENING, 'Kéo thả thành công sang SCREENING');
    assert(step1.previousStatus === CandidateStatus.NEW, 'Ghi nhận chính xác trạng thái trước đó là NEW');

    // 2.2 Drag SCREENING -> SHORTLISTED
    const step2 = await applicationsService.updateStatus(app1Id, {
      status: CandidateStatus.SHORTLISTED,
      note: 'Điểm số matching đạt 92/100, lọt vào danh sách tiềm năng',
      decidedBy: 'Recruiter Admin',
    });
    assert(step2.candidateStatus === CandidateStatus.SHORTLISTED, 'Kéo thả thành công sang SHORTLISTED');

    // 2.3 Drag SHORTLISTED -> INTERVIEW
    const step3 = await applicationsService.updateStatus(app1Id, {
      status: CandidateStatus.INTERVIEW,
      note: 'Mời ứng viên tham gia phỏng vấn kỹ thuật vòng 1',
      decidedBy: 'HR Manager',
    });
    assert(step3.candidateStatus === CandidateStatus.INTERVIEW, 'Kéo thả thành công sang INTERVIEW');

    // 2.4 Drag INTERVIEW -> OFFER (with offerDetails)
    const step4 = await applicationsService.updateStatus(app1Id, {
      status: CandidateStatus.OFFER,
      note: 'Ứng viên trả lời phỏng vấn xuất sắc, gửi thư mời nhận việc',
      offerDetails: { salaryGross: 45000000, startDate: '2026-12-01' },
      decidedBy: 'Department Head',
    });
    assert(step4.candidateStatus === CandidateStatus.OFFER, 'Kéo thả thành công sang OFFER');
    assert(
      step4.recruiterDecision.offerDetails?.salaryGross === 45000000,
      'Lưu chính xác thông tin đề nghị việc làm (Offer Details)',
    );

    // 2.5 Drag OFFER -> HIRED
    const step5 = await applicationsService.updateStatus(app1Id, {
      status: CandidateStatus.HIRED,
      note: 'Ứng viên đã ký kết hợp đồng thử việc chính thức',
      decidedBy: 'HR Generalist',
    });
    assert(step5.candidateStatus === CandidateStatus.HIRED, 'Kéo thả thành công sang HIRED');

    // Check full audit trail history in recruiterDecision
    const appDoc = appsStore.get(app1Id);
    const history = appDoc.recruiterDecision?.history || [];
    assert(
      history.length >= 5,
      `Ghi nhận đầy đủ lịch sử kiểm toán (${history.length} bước chuyển trạng thái)`,
    );
    const lastHistory = history[history.length - 1];
    assert(
      lastHistory.fromStatus === CandidateStatus.OFFER &&
        lastHistory.toStatus === CandidateStatus.HIRED,
      'Bước chuyển lịch sử cuối cùng chuẩn xác: OFFER -> HIRED',
    );
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 3: REJECTION TRANSITION WITH REASON
  // --------------------------------------------------------------------------
  console.log('\n--- 3. KIỂM THỬ TỪ CHỐI ỨNG VIÊN (REJECTED TRANSITION) ---');
  let app2Id: string;
  {
    const app2 = await applicationsService.create({
      candidateId: candidate2Id.toString(),
      jobId: job1Id.toString(),
      cvId: cv2Id.toString(),
    });
    app2Id = app2._id.toString();

    const rejectStep = await applicationsService.updateStatus(app2Id, {
      status: CandidateStatus.REJECTED,
      reason: 'Kinh nghiệm chưa đủ 4 năm theo yêu cầu Senior',
      note: 'Gửi thư cảm ơn và lưu trữ hồ sơ cho đợt tuyển sau',
      decidedBy: 'Recruiter Lead',
    });

    assert(rejectStep.candidateStatus === CandidateStatus.REJECTED, 'Chuyển trạng thái sang REJECTED thành công');
    assert(
      rejectStep.recruiterDecision.reason === 'Kinh nghiệm chưa đủ 4 năm theo yêu cầu Senior',
      'Lưu chính xác lý do từ chối (Rejection Reason)',
    );
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 4: KANBAN BOARD AGGREGATOR (GET /api/v1/applications/kanban)
  // --------------------------------------------------------------------------
  console.log('\n--- 4. KIỂM THỬ TỔNG HỢP BẢNG KANBAN (GET /api/v1/applications/kanban) ---');
  {
    // Attach screening score for app1
    screeningStore.set('scr-1', {
      _id: new Types.ObjectId(),
      applicationId: new Types.ObjectId(app1Id),
      candidateId: candidate1Id,
      jobId: job1Id,
      skillMatchScore: 95,
      experienceMatchScore: 90,
      educationMatchScore: 90,
      certificationMatchScore: 85,
      overallMatchScore: 92.5,
    });

    const kanban = await applicationsService.getKanbanBoard(job1Id.toString());
    assert(kanban.totalApplications === 2, 'Tổng số đơn ứng tuyển trên bảng là 2');
    assert(kanban.columns.length === 7, 'Bảng Kanban có đủ 7 cột chuẩn trạng thái');

    const hiredColumn = kanban.columns.find((c) => c.id === CandidateStatus.HIRED);
    assert(
      hiredColumn?.count === 1 && hiredColumn.cards.length === 1,
      'Cột HIRED có chính xác 1 thẻ ứng viên',
    );
    assert(
      hiredColumn?.cards[0].candidateName === 'Hoàng Minh Tuấn',
      'Thẻ ứng viên tại cột HIRED là Hoàng Minh Tuấn',
    );
    assert(
      hiredColumn?.cards[0].matchScore === 92.5,
      'Hiển thị điểm số matching 92.5% trực tiếp trên thẻ Kanban',
    );

    const rejectedColumn = kanban.columns.find((c) => c.id === CandidateStatus.REJECTED);
    assert(
      rejectedColumn?.count === 1 && rejectedColumn.cards[0].candidateName === 'Đặng Ngọc Lan',
      'Cột REJECTED có chính xác 1 thẻ ứng viên Đặng Ngọc Lan',
    );
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 5: FIND ALL WITH SEARCH & FILTERS
  // --------------------------------------------------------------------------
  console.log('\n--- 5. KIỂM THỬ TRUY VẤN DANH SÁCH & LỌC ĐA TIÊU CHÍ ---');
  {
    // 5.1 Filter by status
    const filterHired = await applicationsService.findAll({ status: CandidateStatus.HIRED });
    assert(filterHired.total === 1, 'Lọc chính xác đơn có trạng thái HIRED');

    // 5.2 Filter by search keyword
    const searchByName = await applicationsService.findAll({ search: 'Lan' });
    assert(searchByName.total === 1, 'Tìm kiếm chính xác đơn ứng tuyển theo tên ứng viên');

    // 5.3 Filter by minScore
    const filterByScore = await applicationsService.findAll({ minScore: 90 });
    assert(filterByScore.total === 1, 'Lọc đơn ứng tuyển có điểm matching >= 90%');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 6: SINGLE APPLICATION 360° DETAIL
  // --------------------------------------------------------------------------
  console.log('\n--- 6. KIỂM THỬ XEM CHI TIẾT ĐƠN ỨNG TUYỂN (360° DETAIL) ---');
  {
    const detail = await applicationsService.findOne(app1Id);
    assert(detail.id === app1Id, 'Lấy đúng đơn ứng tuyển theo ID');
    assert(detail.matchScore === 92.5, 'Kèm điểm số matching chính xác');
    assert(detail.candidateStatus === CandidateStatus.HIRED, 'Trạng thái hiện tại là HIRED');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 7: REMOVE APPLICATION & CASCADE CLEANUP
  // --------------------------------------------------------------------------
  console.log('\n--- 7. KIỂM THỬ XÓA ĐƠN ỨNG TUYỂN & CASCADE CLEANUP ---');
  {
    const deleteResult = await applicationsService.remove(app1Id);
    assert(deleteResult.message.includes('thành công'), 'Xóa đơn ứng tuyển thành công');
    assert(appsStore.has(app1Id) === false, 'Đơn ứng tuyển không còn trong CSDL');
    assert(screeningStore.size === 0, 'Dọn dẹp cascade kết quả screening liên quan');
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT KIỂM THỬ: ${testPassed} PASS / ${testFailed} FAIL`);
  if (testFailed === 0) {
    console.log('🎉 TẤT CẢ TEST CASES CỦA APPLICATIONS MODULE & KANBAN ĐÃ VƯỢT QUA 100%!');
  } else {
    console.log('⚠️ CÓ TEST CASE BỊ LỖI, VUI LÒNG KIỂM TRA LẠI LOG CHI TIẾT Ở TRÊN!');
  }
  console.log('================================================================\n');

  if (testFailed > 0) {
    process.exit(1);
  }
}

runApplicationsModuleTests().catch((err) => {
  console.error('Fatal test error in ApplicationsModule:', err);
  process.exit(1);
});
