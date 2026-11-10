import { QuestionBankService } from '../src/modules/interviews/services/question-bank.service';
import { InterviewsService } from '../src/modules/interviews/interviews.service';
import { AiService } from '../src/modules/ai/ai.service';
import { GeminiProvider } from '../src/modules/ai/providers/gemini.provider';
import { OpenAiProvider } from '../src/modules/ai/providers/openai.provider';
import { MockAiProvider } from '../src/modules/ai/providers/mock.provider';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { QuestionStatus } from '../src/schemas/interview_questions.schema';
import { InterviewQuestionItem } from '../src/modules/interviews/interfaces/interview-question.interface';

// ============================================================================
// IN-MEMORY MOCK MONGOOSE MODEL FACTORY
// ============================================================================
function createMockModel(initialStore: Map<string, any> = new Map()) {
  const store = initialStore;

  const mockModel: any = {
    store,
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
          if (k === 'applicationId' || k === 'candidateId' || k === 'jobId') {
            const itemVal = item[k] ? item[k].toString() : '';
            const queryVal = v ? v.toString() : '';
            if (itemVal !== queryVal) {
              match = false;
              break;
            }
          } else if (item[k] !== v) {
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

  return mockModel;
}

// ============================================================================
// MAIN TEST SUITE
// ============================================================================
async function runInterviewGenerationTests() {
  console.log('================================================================');
  console.log('🎯 BẮT ĐẦU KIỂM THỬ: RAG AI INTERVIEW GENERATION (TUẦN 12)');
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

  // 1. Initialize Providers & Question Bank
  const configService = new ConfigService({});
  const geminiProvider = new GeminiProvider(configService);
  const openaiProvider = new OpenAiProvider(configService);
  const mockAiProvider = new MockAiProvider();
  const aiService = new AiService(geminiProvider, openaiProvider, mockAiProvider);
  const questionBankService = new QuestionBankService();

  // --------------------------------------------------------------------------
  // TEST SUITE 1: DOMAIN QUESTION BANK & RETRIEVAL
  // --------------------------------------------------------------------------
  console.log('--- 1. KIỂM THỬ DOMAIN QUESTION BANK & RAG RETRIEVAL ---');
  {
    const totalCount = questionBankService.getTotalCount();
    assert(totalCount >= 10, 'Ngân hàng câu hỏi được khởi tạo với ít nhất 10 templates chuẩn', `Total: ${totalCount}`);

    // Retrieve by single skill
    const nestTemplates = await questionBankService.retrieveRelevantTemplates({
      skills: ['NestJS'],
      topK: 3,
    });
    assert(nestTemplates.length > 0, 'Truy xuất thành công câu hỏi liên quan đến NestJS');
    assert(
      nestTemplates.some((t) => t.skillOrCompetency.toLowerCase().includes('nest') || t.tags.includes('nestjs')),
      'Câu hỏi trả về đúng chuyên môn NestJS Architecture',
    );

    // Retrieve by Category
    const starTemplates = await questionBankService.retrieveRelevantTemplates({
      skills: ['Management'],
      categories: ['BEHAVIORAL_STAR'],
      topK: 2,
    });
    assert(starTemplates.length > 0, 'Truy xuất câu hỏi chuẩn STAR');
    assert(
      starTemplates.every((t) => t.category === 'BEHAVIORAL_STAR'),
      'Toàn bộ kết quả truy xuất đều thuộc nhóm BEHAVIORAL_STAR',
    );

    // Retrieve by Difficulty
    const hardTemplates = await questionBankService.retrieveRelevantTemplates({
      skills: ['MongoDB', 'PostgreSQL'],
      targetDifficulty: 'HARD',
      topK: 2,
    });
    assert(hardTemplates.length > 0, 'Truy xuất câu hỏi theo mức độ khó HARD');
    assert(
      hardTemplates.some((t) => t.difficulty === 'HARD'),
      'Chứa câu hỏi độ khó HARD liên quan đến DB/Architecture',
    );

    // Semantic / Query text matching
    const incidentTemplates = await questionBankService.retrieveRelevantTemplates({
      skills: ['Incident'],
      queryText: 'sự cố production nghẽn database sập server',
      topK: 1,
    });
    assert(incidentTemplates.length > 0, 'Truy xuất câu hỏi theo ngữ nghĩa query text');
    assert(
      incidentTemplates[0].tags.includes('incident') || incidentTemplates[0].tags.includes('star'),
      'Bốc đúng câu hỏi xử lý sự cố Production',
    );
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 2: INTERVIEWS SERVICE - RAG GENERATION & GROUNDING
  // --------------------------------------------------------------------------
  console.log('\n--- 2. KIỂM THỬ RAG GENERATION, GROUNDING & 4-CATEGORY DISTRIBUTION ---');
  {
    // Setup Mock Database Data
    const appId = new Types.ObjectId();
    const candidateId = new Types.ObjectId();
    const jobId = new Types.ObjectId();
    const cvId = new Types.ObjectId();

    const mockCandidatesStore = new Map();
    mockCandidatesStore.set(candidateId.toString(), {
      _id: candidateId,
      fullName: 'Trần Văn Minh',
      email: 'minh.tran@example.com',
      currentTitle: 'Senior Fullstack Engineer',
    });

    const mockJobsStore = new Map();
    mockJobsStore.set(jobId.toString(), {
      _id: jobId,
      title: 'Senior Backend Engineer (NestJS / Cloud)',
      department: 'Platform Engineering',
      extractedCriteria: {
        requiredSkills: ['NestJS', 'TypeScript', 'Docker', 'MongoDB'],
        preferredSkills: ['Redis', 'Kubernetes'],
        minExperienceYears: 3,
      },
    });

    const mockCvsStore = new Map();
    mockCvsStore.set(cvId.toString(), {
      _id: cvId,
      candidateId,
      parsedData: {
        personalInfo: { fullName: 'Trần Văn Minh', currentTitle: 'Senior Fullstack Engineer' },
        totalYearsExperience: 4,
        skills: {
          technical: ['TypeScript', 'NestJS', 'Node.js', 'MongoDB', 'React'],
          soft: ['Team Leadership', 'Problem Solving'],
        },
        projects: [
          {
            title: 'Hệ Thống Thanh Toán Vi Mô (Micro-Payment Gateway)',
            role: 'Backend Tech Lead',
            technologies: ['NestJS', 'TypeScript', 'MongoDB', 'Redis'],
            description: 'Thiết kế hệ thống xử lý giao dịch tài chính với NestJS và MongoDB.',
          },
        ],
        workExperience: [
          {
            company: 'Công ty Công nghệ FinTech Á Châu',
            role: 'Senior Backend Developer',
            startDate: '2022',
            endDate: '2026',
            responsibilities: ['Xây dựng microservices với NestJS', 'Tối ưu hóa query database'],
          },
        ],
      },
    });

    const mockScreeningStore = new Map();
    mockScreeningStore.set(appId.toString(), {
      _id: new Types.ObjectId(),
      applicationId: appId,
      candidateId,
      jobId,
      overallMatchScore: 82.5,
      detailedMatching: [
        { skill: 'NestJS', matchType: 'EXACT', score: 1.0 },
        { skill: 'TypeScript', matchType: 'EXACT', score: 1.0 },
        { skill: 'MongoDB', matchType: 'EXACT', score: 1.0 },
        { skill: 'Docker', matchType: 'MISSING', score: 0.0 }, // GAP: Missing Docker
      ],
    });

    const mockApplicationsStore = new Map();
    mockApplicationsStore.set(appId.toString(), {
      _id: appId,
      candidateId,
      jobId,
      cvId,
      candidateStatus: 'INTERVIEW',
    });

    const mockQuestionsStore = new Map();

    const interviewsService = new InterviewsService(
      createMockModel(mockQuestionsStore),
      createMockModel(mockApplicationsStore),
      createMockModel(mockCandidatesStore),
      createMockModel(mockJobsStore),
      createMockModel(mockCvsStore),
      createMockModel(mockScreeningStore),
      aiService,
      questionBankService,
    );

    // Run Generation
    const result = await interviewsService.generateQuestions({
      applicationId: appId.toString(),
      numQuestions: 6,
      targetDifficulty: 'MEDIUM',
    });

    assert(!!result.id, 'Tạo thành công bản ghi câu hỏi phỏng vấn trong DB');
    assert(result.questions.length === 6, 'Số lượng câu hỏi sinh ra đúng 6 câu như yêu cầu');
    assert(result.isCached === false, 'Lần đầu sinh câu hỏi có isCached = false');

    const questions: InterviewQuestionItem[] = result.questions as any;

    // Check 4 categories
    const categoriesFound = new Set(questions.map((q) => q.category));
    assert(categoriesFound.has('CLARIFICATION'), 'Chứa câu hỏi nhóm CLARIFICATION');
    assert(categoriesFound.has('TECHNICAL_DEEP_DIVE'), 'Chứa câu hỏi nhóm TECHNICAL_DEEP_DIVE');
    assert(categoriesFound.has('SKILL_GAP'), 'Chứa câu hỏi nhóm SKILL_GAP (đánh trúng lỗ hổng Docker)');
    assert(categoriesFound.has('BEHAVIORAL_STAR'), 'Chứa câu hỏi tình huống chuẩn BEHAVIORAL_STAR');

    // Check Grounding: contextFromCV
    const hasGroundedContext = questions.some(
      (q) => q.contextFromCV && q.contextFromCV.includes('Micro-Payment Gateway'),
    );
    assert(hasGroundedContext, 'Dẫn chứng contextFromCV trích xuất chính xác tên dự án từ hồ sơ ứng viên');

    // Check Skill Gap targeted question
    const gapQuestion = questions.find((q) => q.category === 'SKILL_GAP');
    assert(!!gapQuestion, 'Tìm thấy câu hỏi SKILL_GAP');
    assert(
      gapQuestion?.relatedSkill === 'Docker' || !!(gapQuestion?.question && gapQuestion.question.includes('Docker')),
      'Câu hỏi SKILL_GAP nhắm chính xác vào kỹ năng thiếu hụt (Docker)',
    );

    // Check Rubric Completeness
    const allRubricsComplete = questions.every(
      (q) =>
        q.sampleRubric &&
        typeof q.sampleRubric.poor === 'string' &&
        typeof q.sampleRubric.acceptable === 'string' &&
        typeof q.sampleRubric.excellent === 'string',
    );
    assert(allRubricsComplete, '100% câu hỏi có bareme chấm điểm đầy đủ 3 mức (poor, acceptable, excellent)');

    // Check Expected Key Points
    const allKeyPointsPresent = questions.every(
      (q) => Array.isArray(q.expectedKeyPoints) && q.expectedKeyPoints.length >= 2,
    );
    assert(allKeyPointsPresent, '100% câu hỏi có ít nhất 2 tiêu chí đánh giá mấu chốt (expectedKeyPoints)');

    // ------------------------------------------------------------------------
    // TEST SUITE 3: CACHING BEHAVIOR
    // ------------------------------------------------------------------------
    console.log('\n--- 3. KIỂM THỬ CƠ CHẾ CACHING & TÁI SỬ DỤNG KẾT QUẢ ---');
    const cachedResult: any = await interviewsService.generateQuestions({
      applicationId: appId.toString(),
      regenerate: false,
    });
    assert(Boolean(cachedResult.isCached), 'Gọi lại cùng applicationId trả về kết quả đã cache (isCached = true)');
    assert(cachedResult.questions.length === 6, 'Dữ liệu cache bảo toàn 100% các câu hỏi');

    // Test bypass cache with regenerate: true
    const regeneratedResult = await interviewsService.generateQuestions({
      applicationId: appId.toString(),
      regenerate: true,
      numQuestions: 5,
    });
    assert(regeneratedResult.isCached === false, 'Gọi với regenerate = true sinh lại bộ câu hỏi mới');

    // ------------------------------------------------------------------------
    // TEST SUITE 4: HUMAN-IN-THE-LOOP (EDIT, SCORE, NOTES)
    // ------------------------------------------------------------------------
    console.log('\n--- 4. KIỂM THỬ HUMAN-IN-THE-LOOP (CHỈNH SỬA, CHẤM ĐIỂM & GHI CHÚ) ---');
    const updatedQuestions = [...questions];
    updatedQuestions[0].scoreGiven = 4;
    updatedQuestions[0].notes = 'Ứng viên trình bày rất tự tin về kiến trúc NestJS';

    const updateResponse = await interviewsService.updateQuestions(result.id.toString(), {
      questions: updatedQuestions,
      status: QuestionStatus.REVIEWED,
    });
    assert(updateResponse.status === QuestionStatus.REVIEWED, 'Cập nhật trạng thái thành REVIEWED thành công');

    const fetchedDoc = await interviewsService.getQuestionsById(result.id.toString());
    assert(fetchedDoc.questions[0].scoreGiven === 4, 'Điểm chấm thực tế của Interviewer được lưu chuẩn xác');
    assert(
      fetchedDoc.questions[0].notes === 'Ứng viên trình bày rất tự tin về kiến trúc NestJS',
      'Ghi chú của người phỏng vấn được bảo toàn trọn vẹn',
    );

    // ------------------------------------------------------------------------
    // TEST SUITE 5: EXPORT CAPABILITIES (MARKDOWN, TEXT, JSON)
    // ------------------------------------------------------------------------
    console.log('\n--- 5. KIỂM THỬ XUẤT PHIẾU PHỎNG VẤN (EXPORT MARKDOWN / TEXT / JSON) ---');
    const mdExport = await interviewsService.exportQuestions(result.id.toString(), 'markdown');
    assert(mdExport.format === 'markdown', 'Xuất định dạng Markdown hợp lệ');
    assert(
      typeof mdExport.content === 'string' &&
        mdExport.content.includes('# 📋 Phiếu Phỏng Vấn') &&
        mdExport.content.includes('| Mức Điểm | Tiêu Chí Đánh Giá (Rubric) |'),
      'File Markdown có tiêu đề, bảng rubric và checkbox tiêu chí',
    );

    const textExport = await interviewsService.exportQuestions(result.id.toString(), 'text');
    assert(textExport.format === 'text', 'Xuất định dạng Plain Text hợp lệ');
    assert(
      typeof textExport.content === 'string' && textExport.content.includes('BỘ CÂU HỎI PHỎNG VẤN ỨNG VIÊN'),
      'File Text có cấu trúc phân đoạn rõ ràng',
    );

    const jsonExport = await interviewsService.exportQuestions(result.id.toString(), 'json');
    assert(Array.isArray(jsonExport.questions), 'Xuất định dạng JSON trả về mảng questions');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 6: EDGE CASES & RESILIENCE
  // --------------------------------------------------------------------------
  console.log('\n--- 6. KIỂM THỬ KHẢ NĂNG CHỊU LỖI & EDGE CASES ---');
  {
    const emptyAppId = new Types.ObjectId();
    const emptyCandId = new Types.ObjectId();
    const emptyJobId = new Types.ObjectId();

    const emptyCandStore = new Map();
    emptyCandStore.set(emptyCandId.toString(), {
      _id: emptyCandId,
      fullName: 'Nguyễn Văn B (Fresher chưa có kinh nghiệm)',
    });

    const emptyJobStore = new Map();
    emptyJobStore.set(emptyJobId.toString(), {
      _id: emptyJobId,
      title: 'Junior Frontend Developer',
      extractedCriteria: { requiredSkills: ['HTML', 'CSS', 'JavaScript'] },
    });

    const emptyQuestionsStore = new Map();

    const sparseInterviewsService = new InterviewsService(
      createMockModel(emptyQuestionsStore),
      createMockModel(new Map()),
      createMockModel(emptyCandStore),
      createMockModel(emptyJobStore),
      createMockModel(new Map()), // No CV parsed data
      createMockModel(new Map()), // No Screening result
      aiService,
      questionBankService,
    );

    const fallbackResult = await sparseInterviewsService.generateQuestions({
      candidateId: emptyCandId.toString(),
      jobId: emptyJobId.toString(),
      numQuestions: 4,
    });

    assert(fallbackResult.questions.length >= 2, 'Hồ sơ rỗng / không có CV vẫn sinh câu hỏi an toàn không bị sập');
    assert(
      fallbackResult.questions.every((q) => q.question && q.expectedKeyPoints),
      'Mọi câu hỏi fallback đều bảo toàn schema và key points hợp lệ',
    );
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT KIỂM THỬ: ${testPassed} PASS / ${testFailed} FAIL`);
  if (testFailed === 0) {
    console.log('🎉 TẤT CẢ TEST CASES ĐÃ VƯỢT QUA 100%! HỆ THỐNG SẴN SÀNG SẢN XUẤT!');
  } else {
    console.log('⚠️ CÓ TEST CASE BỊ LỖI, VUI LÒNG KIỂM TRA LẠI LOG CHI TIẾT Ở TRÊN!');
  }
  console.log('================================================================\n');

  if (testFailed > 0) {
    process.exit(1);
  }
}

runInterviewGenerationTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
