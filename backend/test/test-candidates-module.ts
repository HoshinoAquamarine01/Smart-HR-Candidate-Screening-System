import { CandidatesService } from '../src/modules/candidates/candidates.service';
import { Types } from 'mongoose';
import { CandidateStatus } from '../src/schemas/applications.schema';

// ============================================================================
// MOCK MONGOOSE STORE & MODEL FACTORIES
// ============================================================================
function createMockCandidatesModel(store: Map<string, any>) {
  return {
    store,
    find: (filter: any) => {
      let filtered = Array.from(store.values());

      if (filter._id?.$in) {
        const idStrs = new Set(filter._id.$in.map((id: any) => id.toString()));
        filtered = filtered.filter((c) => idStrs.has(c._id.toString()));
      }

      if (filter.$or) {
        filtered = filtered.filter((item) =>
          filter.$or.some((cond: any) => {
            if (cond.fullName) return cond.fullName.test(item.fullName || '');
            if (cond.email) return cond.email.test(item.email || '');
            if (cond.phone) return cond.phone.test(item.phone || '');
            if (cond.currentTitle) return cond.currentTitle.test(item.currentTitle || '');
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
          if (filter._id?.$in) {
            const idStrs = new Set(filter._id.$in.map((id: any) => id.toString()));
            if (!idStrs.has(item._id.toString())) match = false;
          }
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
    findOne: (query: any) => {
      let found: any = null;
      for (const item of store.values()) {
        let match = true;
        for (const [k, v] of Object.entries(query)) {
          if (item[k] !== v) {
            match = false;
            break;
          }
        }
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

function createMockApplicationsModel(store: Map<string, any>) {
  return {
    store,
    find: (filter: any) => {
      let filtered = Array.from(store.values());

      if (filter.candidateId?.$in) {
        const idStrs = new Set(filter.candidateId.$in.map((id: any) => id.toString()));
        filtered = filtered.filter((a) => idStrs.has(a.candidateId?.toString()));
      }
      if (filter.candidateId && !filter.candidateId.$in) {
        filtered = filtered.filter((a) => a.candidateId?.toString() === filter.candidateId.toString());
      }
      if (filter.jobId) {
        filtered = filtered.filter((a) => a.jobId?.toString() === filter.jobId.toString());
      }
      if (filter.candidateStatus) {
        filtered = filtered.filter((a) => a.candidateStatus === filter.candidateStatus);
      }

      return {
        select: () => ({
          exec: async () => filtered.map((f) => ({ candidateId: f.candidateId })),
        }),
        populate: () => ({
          exec: async () => filtered,
          sort: () => ({
            exec: async () => filtered,
          }),
        }),
        sort: () => ({
          exec: async () => filtered,
        }),
        exec: async () => filtered,
      };
    },
    findOne: (query: any) => {
      let found: any = null;
      for (const item of store.values()) {
        let match = true;
        if (query.candidateId && item.candidateId?.toString() !== query.candidateId.toString()) match = false;
        if (query.jobId && item.jobId?.toString() !== query.jobId.toString()) match = false;
        if (match) {
          found = item;
          break;
        }
      }
      return {
        sort: () => ({
          exec: async () => (found ? wrapDoc(found) : null),
        }),
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
    deleteMany: (query: any) => ({
      exec: async () => {
        let deleted = 0;
        for (const [k, v] of store.entries()) {
          if (query.candidateId && v.candidateId?.toString() === query.candidateId.toString()) {
            store.delete(k);
            deleted++;
          }
        }
        return { deletedCount: deleted };
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

function createMockCvsModel(store: Map<string, any>) {
  return {
    store,
    find: (filter: any) => {
      let filtered = Array.from(store.values());

      if (filter.candidateId?.$in) {
        const idStrs = new Set(filter.candidateId.$in.map((id: any) => id.toString()));
        filtered = filtered.filter((c) => idStrs.has(c.candidateId?.toString()));
      }
      if (filter.candidateId && !filter.candidateId.$in) {
        filtered = filtered.filter((c) => c.candidateId?.toString() === filter.candidateId.toString());
      }
      if (filter.$or) {
        const regex = filter.$or[0]?.['parsedData.skills.technical'];
        filtered = filtered.filter((c) => {
          const techSkills = c.parsedData?.skills?.technical || [];
          const softSkills = c.parsedData?.skills?.soft || [];
          const all = [...techSkills, ...softSkills];
          return regex instanceof RegExp
            ? all.some((s: string) => regex.test(s))
            : true;
        });
      }

      return {
        select: () => ({
          exec: async () => filtered.map((c) => ({ candidateId: c.candidateId })),
        }),
        sort: () => ({
          exec: async () => filtered,
        }),
        exec: async () => filtered,
      };
    },
  };
}

function createMockScreeningModel(store: Map<string, any>) {
  return {
    store,
    find: (filter: any) => {
      let filtered = Array.from(store.values());
      if (filter.candidateId?.$in) {
        const idStrs = new Set(filter.candidateId.$in.map((id: any) => id.toString()));
        filtered = filtered.filter((s) => idStrs.has(s.candidateId?.toString()));
      }
      return {
        exec: async () => filtered,
      };
    },
  };
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
async function runCandidatesModuleTests() {
  console.log('================================================================');
  console.log('🎯 BẮT ĐẦU KIỂM THỬ: CANDIDATES MODULE & PIPELINE MANAGEMENT');
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

  const candidatesStore = new Map<string, any>();
  const appsStore = new Map<string, any>();
  const cvsStore = new Map<string, any>();
  const screeningStore = new Map<string, any>();

  const mockCandModel = createMockCandidatesModel(candidatesStore);
  const mockAppsModel = createMockApplicationsModel(appsStore);
  const mockCvsModel = createMockCvsModel(cvsStore);
  const mockScreeningModel = createMockScreeningModel(screeningStore);
  const mockJobsModel: any = {};

  const candidatesService = new CandidatesService(
    mockCandModel as any,
    mockAppsModel as any,
    mockCvsModel as any,
    mockJobsModel,
    mockScreeningModel as any,
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 1: CANDIDATE CREATION & DEDUPLICATION
  // --------------------------------------------------------------------------
  console.log('--- 1. KIỂM THỬ TẠO ỨNG VIÊN & KHỬ TRÙNG LẶP EMAIL ---');
  let cand1Id: string;
  {
    const cand1 = await candidatesService.create({
      fullName: 'Nguyễn Thành Nam',
      email: 'nam.nguyen@example.com',
      phone: '0901234567',
      location: 'Hà Nội',
      currentTitle: 'Senior Backend Engineer',
    });

    assert(!!cand1._id, 'Tạo ứng viên mới thành công trong CSDL');
    cand1Id = cand1._id.toString();
    assert(cand1.fullName === 'Nguyễn Thành Nam', 'Lưu chính xác họ tên ứng viên');
    assert(cand1.email === 'nam.nguyen@example.com', 'Lưu chính xác email');

    // Deduplication check: try creating again with same email
    const duplicate = await candidatesService.create({
      fullName: 'Nguyễn Thành Nam Duplicate',
      email: 'nam.nguyen@example.com',
    });
    assert(
      duplicate._id.toString() === cand1Id,
      'Khử trùng lặp email: Tự động trả về bản ghi cũ, không tạo thêm bản ghi rác',
    );
    assert(candidatesStore.size === 1, 'Tổng số ứng viên trong CSDL vẫn là 1');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 2: DATA ENRICHMENT WITH CV, APPLICATION & SCORES
  // --------------------------------------------------------------------------
  console.log('\n--- 2. KIỂM THỬ ĐỒNG BỘ DỮ LIỆU CV, APPLICATION & SCREENING SCORES ---');
  const jobId = new Types.ObjectId();
  {
    // Attach CV to cand1
    const cand1ObjectId = new Types.ObjectId(cand1Id);
    const cv1Id = new Types.ObjectId();
    cvsStore.set(cv1Id.toString(), {
      _id: cv1Id,
      candidateId: cand1ObjectId,
      fileName: 'Nguyen_Thanh_Nam_CV.pdf',
      fileUrl: '/uploads/cvs/nam_cv.pdf',
      fileSize: 102400,
      parsedData: {
        personalInfo: { fullName: 'Nguyễn Thành Nam', currentTitle: 'Lead Software Architect' },
        totalYearsExperience: 5,
        skills: { technical: ['NestJS', 'TypeScript', 'MongoDB', 'Docker'], soft: ['Leadership'] },
        workExperience: [{ company: 'TechCorp', role: 'Senior Lead' }],
        projects: [{ title: 'Payment Platform', technologies: ['NestJS', 'MongoDB'] }],
      },
      createdAt: new Date(),
    });

    // Attach Application to cand1
    const appId = new Types.ObjectId();
    appsStore.set(appId.toString(), {
      _id: appId,
      candidateId: cand1ObjectId,
      jobId,
      candidateStatus: CandidateStatus.SHORTLISTED,
      createdAt: new Date(),
    });

    // Attach Screening Score to cand1
    const scr1Id = new Types.ObjectId();
    screeningStore.set(scr1Id.toString(), {
      _id: scr1Id,
      applicationId: appId,
      candidateId: cand1ObjectId,
      jobId,
      skillMatchScore: 95,
      experienceMatchScore: 100,
      educationMatchScore: 90,
      overallMatchScore: 94.5,
      detailedMatching: [{ skill: 'NestJS', score: 1.0 }],
      aiRationale: { summary: 'Ứng viên xuất sắc' },
    });

    // Query findOne
    const detail = await candidatesService.findOne(cand1Id);
    assert(detail._id.toString() === cand1Id, 'Lấy chi tiết ứng viên theo ID');
    assert(detail.parsedProfile.totalYearsExperience === 5, 'Bóc tách chính xác 5 năm kinh nghiệm từ CV');
    assert(detail.parsedProfile.skills.technical.includes('NestJS'), 'Kỹ năng technical chứa NestJS');
    assert(detail.cvs.length === 1 && detail.cvs[0].fileName === 'Nguyen_Thanh_Nam_CV.pdf', 'Danh sách CV đính kèm chính xác');
    assert(detail.applications.length === 1, 'Lịch sử ứng tuyển có 1 bản ghi');
    assert(detail.applications[0].candidateStatus === CandidateStatus.SHORTLISTED, 'Trạng thái ứng tuyển là SHORTLISTED');
    assert(detail.applications[0].matchScore === 94.5, 'Điểm số matching đồng bộ chính xác (94.5%)');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 3: FIND ALL WITH PAGINATION, SEARCH & MULTI-FACETED FILTER
  // --------------------------------------------------------------------------
  console.log('\n--- 3. KIỂM THỬ DANH SÁCH, TÌM KIẾM & LỌC ĐA TIÊU CHÍ (SKILL, STATUS, SCORE) ---');
  {
    // Create candidate 2 (Fresher, status: NEW, score: 60)
    const cand2 = await candidatesService.create({
      fullName: 'Lê Thu Trang',
      email: 'trang.le@example.com',
      currentTitle: 'Junior Frontend Developer',
    });
    const cand2ObjectId = cand2._id;

    const cv2Id = new Types.ObjectId();
    cvsStore.set(cv2Id.toString(), {
      _id: cv2Id,
      candidateId: cand2ObjectId,
      fileName: 'Le_Thu_Trang_CV.pdf',
      parsedData: {
        totalYearsExperience: 1,
        skills: { technical: ['React', 'JavaScript', 'HTML', 'CSS'] },
      },
    });

    const app2Id = new Types.ObjectId();
    appsStore.set(app2Id.toString(), {
      _id: app2Id,
      candidateId: cand2ObjectId,
      jobId,
      candidateStatus: CandidateStatus.NEW,
    });

    const scr2Id = new Types.ObjectId();
    screeningStore.set(scr2Id.toString(), {
      _id: scr2Id,
      applicationId: app2Id,
      candidateId: cand2ObjectId,
      jobId,
      overallMatchScore: 60.0,
    });

    // 1. Basic pagination
    const allList = await candidatesService.findAll({ page: 1, limit: 10 });
    assert(allList.total === 2, 'Lấy danh sách tất cả ứng viên (total = 2)');
    assert(allList.items.length === 2, 'Số lượng bản ghi trả về đúng 2');

    // 2. Keyword search by name
    const searchByName = await candidatesService.findAll({ search: 'Trang' });
    assert(searchByName.items.length === 1 && searchByName.items[0].fullName.includes('Trang'), 'Tìm kiếm chính xác theo tên');

    // 3. Filter by Status
    const filterByStatus = await candidatesService.findAll({ status: CandidateStatus.SHORTLISTED });
    assert(
      filterByStatus.items.length === 1 && filterByStatus.items[0].status === CandidateStatus.SHORTLISTED,
      'Lọc chính xác ứng viên có trạng thái SHORTLISTED',
    );

    // 4. Filter by Skill
    const filterBySkill = await candidatesService.findAll({ skill: 'NestJS' });
    assert(filterBySkill.items.length === 1 && filterBySkill.items[0].fullName.includes('Nam'), 'Lọc chính xác ứng viên có kỹ năng NestJS');

    // 5. Filter by Min Score
    const filterByScore = await candidatesService.findAll({ minScore: 80 });
    assert(
      filterByScore.items.length === 1 && (filterByScore.items[0].matchScore || 0) >= 80,
      'Lọc chính xác ứng viên có điểm số >= 80% (loại ứng viên 60%)',
    );
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 4: UPDATE PROFILE & ANONYMIZATION
  // --------------------------------------------------------------------------
  console.log('\n--- 4. KIỂM THỬ CẬP NHẬT HỒ SƠ & TÍNH NĂNG ẨN DANH (ANONYMIZED) ---');
  {
    const updated = await candidatesService.update(cand1Id, {
      location: 'Đà Nẵng / Remote',
      anonymized: true,
    });
    assert(updated.location === 'Đà Nẵng / Remote', 'Cập nhật địa điểm làm việc thành công');
    assert(updated.anonymized === true, 'Kích hoạt cờ ẩn danh (anonymized: true) bảo vệ quyền riêng tư');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 5: PIPELINE STATUS TRANSITION (KANBAN WORKFLOW)
  // --------------------------------------------------------------------------
  console.log('\n--- 5. KIỂM THỬ CHUYỂN TRẠNG THÁI PIPELINE (KANBAN STATUS TRANSITION) ---');
  {
    // Transition from SHORTLISTED to INTERVIEW
    const transition1 = await candidatesService.updateStatus(cand1Id, {
      status: CandidateStatus.INTERVIEW,
      jobId: jobId.toString(),
      note: 'Ứng viên đạt yêu cầu sàng lọc, chuyển sang phỏng vấn',
    });
    assert(transition1.status === CandidateStatus.INTERVIEW, 'Chuyển trạng thái sang INTERVIEW thành công');

    // Transition from INTERVIEW to HIRED
    const transition2 = await candidatesService.updateStatus(cand1Id, {
      status: CandidateStatus.HIRED,
      jobId: jobId.toString(),
    });
    assert(transition2.status === CandidateStatus.HIRED, 'Chuyển trạng thái sang HIRED thành công');

    const candAfterTransition = await candidatesService.findOne(cand1Id);
    assert(
      candAfterTransition.applications[0].candidateStatus === CandidateStatus.HIRED,
      'Xác nhận trạng thái ứng viên trong CSDL là HIRED',
    );
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 6: REMOVE CANDIDATE & CASCADE DELETION
  // --------------------------------------------------------------------------
  console.log('\n--- 6. KIỂM THỬ XÓA ỨNG VIÊN & ĐỒNG BỘ APPLICATIONS ---');
  {
    const deleteResult = await candidatesService.remove(cand1Id);
    assert(deleteResult.message.includes('xóa hồ sơ ứng viên thành công'), 'Xóa ứng viên thành công');

    let notFound = false;
    try {
      await candidatesService.findOne(cand1Id);
    } catch (e: any) {
      notFound = true;
    }
    assert(notFound, 'Ứng viên không còn tồn tại trong CSDL sau khi xóa');
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT KIỂM THỬ: ${testPassed} PASS / ${testFailed} FAIL`);
  if (testFailed === 0) {
    console.log('🎉 TẤT CẢ TEST CASES CỦA CANDIDATES MODULE ĐÃ VƯỢT QUA 100%!');
  } else {
    console.log('⚠️ CÓ TEST CASE BỊ LỖI, VUI LÒNG KIỂM TRA LẠI LOG CHI TIẾT Ở TRÊN!');
  }
  console.log('================================================================\n');

  if (testFailed > 0) {
    process.exit(1);
  }
}

runCandidatesModuleTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
