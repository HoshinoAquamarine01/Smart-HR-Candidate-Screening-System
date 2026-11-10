/**
 * Unit & Integration Test Suite for AnalyticsModule & Recruitment Dashboard
 * Requirements: [FR-REP-01]
 *
 * Covers:
 * 1. Recruitment Overview Summary (Total applications, candidates, jobs, average score)
 * 2. Pipeline Funnel Distribution across stages (NEW, SCREENING, SHORTLISTED, INTERVIEW, OFFER, HIRED, REJECTED)
 * 3. Matching Score Distribution Brackets (<50%, 50-75%, >75%)
 * 4. Top 5 Candidate Missing Skill Gaps aggregation
 * 5. Job-specific Filtering (Query by jobId)
 * 6. Edge cases: Empty state handling (No division by zero or NaN)
 */

import { Types } from 'mongoose';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { CandidateStatus } from '../src/schemas/applications.schema';

// ============================================================================
// IN-MEMORY MOCK MONGOOSE MODELS (TEST SCOPE ONLY)
// ============================================================================

function createMockAnalyticsModels(
  appsStore: Map<string, any>,
  candStore: Map<string, any>,
  jobsStore: Map<string, any>,
  screeningStore: Map<string, any>,
) {
  const mockAppsModel = {
    find: (filter: any = {}) => {
      let filtered = Array.from(appsStore.values());
      if (filter.jobId) {
        filtered = filtered.filter(
          (a) => a.jobId?.toString() === filter.jobId.toString(),
        );
      }
      return {
        populate: () => ({
          exec: async () =>
            filtered.map((a) => {
              const job = jobsStore.get(a.jobId?.toString());
              return {
                ...a,
                jobId: job ? { _id: job._id, title: job.title, department: job.department, status: job.status } : a.jobId,
              };
            }),
        }),
        exec: async () => filtered,
      };
    },
  };

  const mockCandModel = {
    countDocuments: () => ({
      exec: async () => candStore.size,
    }),
  };

  const mockJobsModel = {
    find: () => ({
      select: () => ({
        exec: async () => Array.from(jobsStore.values()),
      }),
      exec: async () => Array.from(jobsStore.values()),
    }),
  };

  const mockScreeningModel = {
    find: (filter: any = {}) => {
      let filtered = Array.from(screeningStore.values());
      if (filter.jobId) {
        filtered = filtered.filter(
          (s) => s.jobId?.toString() === filter.jobId.toString(),
        );
      }
      return {
        exec: async () => filtered,
      };
    },
  };

  const mockCvsModel = {
    find: () => ({
      exec: async () => [],
    }),
  };

  return {
    mockAppsModel,
    mockCandModel,
    mockJobsModel,
    mockScreeningModel,
    mockCvsModel,
  };
}

// ============================================================================
// MAIN TEST SUITE RUNNER
// ============================================================================
async function runAnalyticsModuleTests() {
  console.log('================================================================');
  console.log('🎯 BẮT ĐẦU KIỂM THỬ: RECRUITMENT ANALYTICS & DASHBOARD');
  console.log('   MÃ YÊU CẦU: [FR-REP-01]');
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
  const candStore = new Map<string, any>();
  const jobsStore = new Map<string, any>();
  const screeningStore = new Map<string, any>();

  const {
    mockAppsModel,
    mockCandModel,
    mockJobsModel,
    mockScreeningModel,
    mockCvsModel,
  } = createMockAnalyticsModels(appsStore, candStore, jobsStore, screeningStore);

  const analyticsService = new AnalyticsService(
    mockAppsModel as any,
    mockCandModel as any,
    mockJobsModel as any,
    mockScreeningModel as any,
    mockCvsModel as any,
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 1: EMPTY STATE SAFETY (NO APPLICATIONS / JOBS)
  // --------------------------------------------------------------------------
  console.log('--- 1. KIỂM THỬ KHẢ NĂNG XỬ LÝ KHI CƠ SỞ DỮ LIỆU RỖNG (EDGE CASE) ---');
  {
    const emptyOverview = await analyticsService.getDashboardOverview({});
    assert(emptyOverview.summary.totalApplications === 0, 'Tổng số đơn ứng tuyển là 0 khi rỗng');
    assert(emptyOverview.summary.averageScore === 0, 'Điểm số trung bình là 0 (Không bị lỗi NaN/chia cho 0)');
    assert(emptyOverview.pipelineDistribution.stagesList.length === 7, 'Khởi tạo đủ 7 vòng tuyển dụng dù chưa có dữ liệu');
    assert(emptyOverview.scoreDistribution.brackets.length === 3, 'Khởi tạo đủ 3 dải phân bố điểm số');
    assert(emptyOverview.topSkillGaps.length === 0, 'Danh sách kỹ năng thiếu hụt rỗng an toàn');
  }

  // --------------------------------------------------------------------------
  // SEED SAMPLE DATA FOR PRODUCTION-LIKE ANALYTICS
  // --------------------------------------------------------------------------
  console.log('\n--- 2. KHỞI TẠO DỮ LIỆU MẪU ĐỂ ĐÁNH GIÁ THỐNG KÊ ---');

  // Seed 2 Jobs
  const job1Id = new Types.ObjectId();
  jobsStore.set(job1Id.toString(), {
    _id: job1Id,
    title: 'Senior Backend Engineer',
    department: 'Platform Engineering',
    status: 'PUBLISHED',
  });

  const job2Id = new Types.ObjectId();
  jobsStore.set(job2Id.toString(), {
    _id: job2Id,
    title: 'Frontend React Specialist',
    department: 'Web Engineering',
    status: 'CLOSED',
  });

  // Seed 4 Candidates
  for (let i = 1; i <= 4; i++) {
    const cId = new Types.ObjectId();
    candStore.set(cId.toString(), {
      _id: cId,
      fullName: `Candidate ${i}`,
      email: `candidate${i}@example.com`,
    });
  }

  // Seed 5 Applications across diverse stages
  // App 1: NEW, score 45 (< 50%)
  const app1Id = new Types.ObjectId();
  appsStore.set(app1Id.toString(), {
    _id: app1Id,
    jobId: job1Id,
    candidateStatus: CandidateStatus.NEW,
    appliedAt: new Date('2026-11-01'),
  });
  screeningStore.set('scr-1', {
    _id: new Types.ObjectId(),
    applicationId: app1Id,
    jobId: job1Id,
    overallMatchScore: 45.0, // < 50%
    detailedMatching: [
      { skill: 'Kubernetes', score: 0, matchType: 'NONE' },
      { skill: 'AWS', score: 0, matchType: 'NONE' },
      { skill: 'Docker', score: 1.0, matchType: 'EXACT' },
    ],
  });

  // App 2: SCREENING, score 68 (50 - 75%)
  const app2Id = new Types.ObjectId();
  appsStore.set(app2Id.toString(), {
    _id: app2Id,
    jobId: job1Id,
    candidateStatus: CandidateStatus.SCREENING,
    appliedAt: new Date('2026-11-02'),
  });
  screeningStore.set('scr-2', {
    _id: new Types.ObjectId(),
    applicationId: app2Id,
    jobId: job1Id,
    overallMatchScore: 68.0, // 50 - 75%
    detailedMatching: [
      { skill: 'Kubernetes', score: 0, matchType: 'NONE' },
      { skill: 'Redis', score: 0, matchType: 'NONE' },
      { skill: 'NestJS', score: 1.0, matchType: 'EXACT' },
    ],
  });

  // App 3: INTERVIEW, score 88 (> 75%)
  const app3Id = new Types.ObjectId();
  appsStore.set(app3Id.toString(), {
    _id: app3Id,
    jobId: job1Id,
    candidateStatus: CandidateStatus.INTERVIEW,
    appliedAt: new Date('2026-11-03'),
  });
  screeningStore.set('scr-3', {
    _id: new Types.ObjectId(),
    applicationId: app3Id,
    jobId: job1Id,
    overallMatchScore: 88.0, // > 75%
    detailedMatching: [
      { skill: 'Kubernetes', score: 0, matchType: 'NONE' },
      { skill: 'NestJS', score: 1.0, matchType: 'EXACT' },
      { skill: 'TypeScript', score: 1.0, matchType: 'EXACT' },
    ],
  });

  // App 4: HIRED, score 95 (> 75%)
  const app4Id = new Types.ObjectId();
  appsStore.set(app4Id.toString(), {
    _id: app4Id,
    jobId: job1Id,
    candidateStatus: CandidateStatus.HIRED,
    appliedAt: new Date('2026-11-04'),
  });
  screeningStore.set('scr-4', {
    _id: new Types.ObjectId(),
    applicationId: app4Id,
    jobId: job1Id,
    overallMatchScore: 95.0, // > 75%
    detailedMatching: [
      { skill: 'NestJS', score: 1.0, matchType: 'EXACT' },
      { skill: 'TypeScript', score: 1.0, matchType: 'EXACT' },
      { skill: 'Docker', score: 1.0, matchType: 'EXACT' },
      { skill: 'Kubernetes', score: 1.0, matchType: 'EXACT' },
    ],
  });

  // App 5: REJECTED, score 30 (< 50%) for Job 2
  const app5Id = new Types.ObjectId();
  appsStore.set(app5Id.toString(), {
    _id: app5Id,
    jobId: job2Id,
    candidateStatus: CandidateStatus.REJECTED,
    appliedAt: new Date('2026-11-05'),
  });
  screeningStore.set('scr-5', {
    _id: new Types.ObjectId(),
    applicationId: app5Id,
    jobId: job2Id,
    overallMatchScore: 30.0, // < 50%
    detailedMatching: [
      { skill: 'React', score: 0, matchType: 'NONE' },
      { skill: 'GraphQL', score: 0, matchType: 'NONE' },
      { skill: 'Redis', score: 0, matchType: 'NONE' },
    ],
  });

  console.log(' ✅ Đã nạp thành công 2 Jobs, 4 Candidates, 5 Applications và 5 Screening Results.');

  // --------------------------------------------------------------------------
  // TEST SUITE 3: TOTAL OVERVIEW SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n--- 3. KIỂM THỬ TỔNG QUAN HỒ SƠ & TỶ LỆ SÀNG LỌC ---');
  {
    const overview = await analyticsService.getDashboardOverview({});
    assert(overview.summary.totalApplications === 5, 'Tổng số lượng hồ sơ tiếp nhận là 5');
    assert(overview.summary.totalCandidates === 4, 'Tổng số lượng ứng viên là 4');
    assert(overview.summary.totalJobs === 2, 'Tổng số lượng vị trí tuyển dụng là 2');
    assert(overview.summary.activeJobs === 1, 'Số lượng vị trí đang mở (PUBLISHED) là 1');
    assert(overview.summary.totalScreened === 5, 'Tổng số hồ sơ đã được AI chấm điểm là 5');

    // Expected average: (45 + 68 + 88 + 95 + 30) / 5 = 326 / 5 = 65.2
    assert(overview.summary.averageScore === 65.2, 'Điểm số matching trung bình là 65.2%');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 4: PIPELINE STAGE DISTRIBUTION
  // --------------------------------------------------------------------------
  console.log('\n--- 4. KIỂM THỬ SỐ LƯỢNG ỨNG VIÊN Ở TỪNG VÒNG (NEW, SCREENING, INTERVIEW, HIRED) ---');
  {
    const overview = await analyticsService.getDashboardOverview({});
    const byStage = overview.pipelineDistribution.byStage;

    assert(byStage[CandidateStatus.NEW].count === 1, 'Số lượng ứng viên vòng NEW = 1');
    assert(byStage[CandidateStatus.SCREENING].count === 1, 'Số lượng ứng viên vòng SCREENING = 1');
    assert(byStage[CandidateStatus.INTERVIEW].count === 1, 'Số lượng ứng viên vòng INTERVIEW = 1');
    assert(byStage[CandidateStatus.HIRED].count === 1, 'Số lượng ứng viên vòng HIRED = 1');
    assert(byStage[CandidateStatus.REJECTED].count === 1, 'Số lượng ứng viên bị REJECTED = 1');

    assert(byStage[CandidateStatus.HIRED].percentage === 20.0, 'Tỷ lệ tuyển dụng thành công là 20.0% (1/5)');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 5: MATCHING SCORE DISTRIBUTION BRACKETS (<50%, 50-75%, >75%)
  // --------------------------------------------------------------------------
  console.log('\n--- 5. KIỂM THỬ PHÂN BỐ ĐIỂM SỐ MATCHING (< 50%, 50 - 75%, > 75%) ---');
  {
    const overview = await analyticsService.getDashboardOverview({});
    const scoreDist = overview.scoreDistribution;

    // Scores: 45 (<50), 68 (50-75), 88 (>75), 95 (>75), 30 (<50)
    // Below 50: 2 (40%)
    // 50 - 75: 1 (20%)
    // Above 75: 2 (40%)
    assert(scoreDist.below50.count === 2, 'Số lượng hồ sơ dưới 50% là 2 (45% và 30%)');
    assert(scoreDist.below50.percentage === 40.0, 'Tỷ lệ hồ sơ dưới 50% là 40.0%');

    assert(scoreDist.from50to75.count === 1, 'Số lượng hồ sơ 50% - 75% là 1 (68%)');
    assert(scoreDist.from50to75.percentage === 20.0, 'Tỷ lệ hồ sơ 50% - 75% là 20.0%');

    assert(scoreDist.above75.count === 2, 'Số lượng hồ sơ trên 75% là 2 (88% và 95%)');
    assert(scoreDist.above75.percentage === 40.0, 'Tỷ lệ hồ sơ trên 75% là 40.0%');

    assert(scoreDist.highestScore === 95, 'Điểm số cao nhất là 95%');
    assert(scoreDist.lowestScore === 30, 'Điểm số thấp nhất là 30%');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 6: TOP 5 MISSING SKILL GAPS
  // --------------------------------------------------------------------------
  console.log('\n--- 6. KIỂM THỬ TOP 5 KỸ NĂNG THIẾU HỤT NHIỀU NHẤT ---');
  {
    const overview = await analyticsService.getDashboardOverview({});
    const topGaps = overview.topSkillGaps;

    assert(topGaps.length <= 5, 'Giới hạn kết quả chính xác trong Top 5');

    // Missing occurrences:
    // Kubernetes: missing in app1, app2, app3 -> 3 times
    // Redis: missing in app2, app5 -> 2 times
    // AWS: missing in app1 -> 1 time
    // React: missing in app5 -> 1 time
    // GraphQL: missing in app5 -> 1 time
    const top1 = topGaps[0];
    assert(top1.skill === 'Kubernetes', 'Kỹ năng thiếu hụt nhiều nhất là Kubernetes');
    assert(top1.missingCount === 3, 'Kubernetes bị thiếu ở 3 ứng viên');
    assert(top1.percentage === 60.0, 'Tỷ lệ thiếu hụt Kubernetes là 60.0% (3/5 hồ sơ)');

    const top2 = topGaps[1];
    assert(top2.skill === 'Redis', 'Kỹ năng thiếu hụt thứ hai là Redis');
    assert(top2.missingCount === 2, 'Redis bị thiếu ở 2 ứng viên');
    assert(top2.percentage === 40.0, 'Tỷ lệ thiếu hụt Redis là 40.0% (2/5 hồ sơ)');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 7: FILTER BY SPECIFIC JOB ID
  // --------------------------------------------------------------------------
  console.log('\n--- 7. KIỂM THỬ LỌC THỐNG KÊ THEO TỪNG VỊ TRÍ TUYỂN DỤNG (jobId) ---');
  {
    const job1Overview = await analyticsService.getDashboardOverview({
      jobId: job1Id.toString(),
    });

    assert(
      job1Overview.summary.totalApplications === 4,
      'Lọc chính xác 4 hồ sơ nộp cho Senior Backend Engineer',
    );
    // Scores for Job 1: 45, 68, 88, 95 -> avg = 296 / 4 = 74.0
    assert(job1Overview.summary.averageScore === 74.0, 'Điểm trung bình riêng của Job 1 là 74.0%');
    assert(job1Overview.scoreDistribution.below50.count === 1, 'Job 1 chỉ có 1 hồ sơ dưới 50%');
    assert(job1Overview.scoreDistribution.above75.count === 2, 'Job 1 có 2 hồ sơ trên 75%');
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT KIỂM THỬ: ${testPassed} PASS / ${testFailed} FAIL`);
  if (testFailed === 0) {
    console.log('🎉 TẤT CẢ TEST CASES CỦA ANALYTICS MODULE ĐÃ VƯỢT QUA 100%!');
  } else {
    console.log('⚠️ CÓ TEST CASE BỊ LỖI, VUI LÒNG KIỂM TRA LẠI LOG CHI TIẾT Ở TRÊN!');
  }
  console.log('================================================================\n');

  if (testFailed > 0) {
    process.exit(1);
  }
}

runAnalyticsModuleTests().catch((err) => {
  console.error('Fatal test error in AnalyticsModule:', err);
  process.exit(1);
});

