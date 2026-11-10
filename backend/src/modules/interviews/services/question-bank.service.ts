import { Injectable, Logger } from '@nestjs/common';
import {
  InterviewCategory,
  QuestionDifficulty,
  QuestionTemplate,
} from '../interfaces/interview-question.interface';
import { CosineSimilarityUtil } from '../../screening/utils/cosine-similarity.util';

@Injectable()
export class QuestionBankService {
  private readonly logger = new Logger(QuestionBankService.name);
  private templates: QuestionTemplate[] = [];

  constructor() {
    this.initializeQuestionBank();
    this.logger.log(`QuestionBankService initialized with ${this.templates.length} domain templates.`);
  }

  /**
   * Retrieve relevant question templates based on target skills, categories, and query concepts
   */
  async retrieveRelevantTemplates(params: {
    skills: string[];
    categories?: InterviewCategory[];
    targetDifficulty?: QuestionDifficulty;
    topK?: number;
    queryText?: string;
  }): Promise<QuestionTemplate[]> {
    const { skills, categories, targetDifficulty, topK = 6, queryText } = params;

    const normalizedSkills = skills.map((s) => s.toLowerCase().trim());
    const queryLower = queryText ? queryText.toLowerCase() : '';

    // Score and rank templates
    const scored = this.templates.map((tpl) => {
      let score = 0;

      // 1. Category match
      if (categories && categories.length > 0) {
        if (categories.includes(tpl.category)) {
          score += 3.0;
        } else {
          return { tpl, score: -1 }; // Exclude non-matching categories if strict
        }
      }

      // 2. Skill match
      const tplSkillLower = tpl.skillOrCompetency.toLowerCase();
      const directSkillMatch = normalizedSkills.some(
        (s) => tplSkillLower.includes(s) || s.includes(tplSkillLower),
      );
      if (directSkillMatch) {
        score += 5.0;
      }

      // 3. Tag match
      const tagMatchCount = tpl.tags.filter((tag) =>
        normalizedSkills.some((s) => tag.toLowerCase().includes(s) || s.includes(tag.toLowerCase())),
      ).length;
      score += tagMatchCount * 2.0;

      // 4. Difficulty alignment
      if (targetDifficulty && tpl.difficulty === targetDifficulty) {
        score += 1.5;
      }

      // 5. Query text match (Semantic / Keyword)
      if (queryLower) {
        if (tpl.templateQuestion.toLowerCase().includes(queryLower)) {
          score += 3.0;
        }
        if (tpl.purpose.toLowerCase().includes(queryLower)) {
          score += 2.0;
        }
      }

      // 6. Vector Cosine Similarity if embedding available
      if (tpl.embedding && tpl.embedding.length > 0 && queryText) {
        const queryVec = CosineSimilarityUtil.generateDeterministicEmbedding(queryText);
        const cos = CosineSimilarityUtil.calculateCosine(tpl.embedding, queryVec);
        score += Math.max(0, cos) * 4.0;
      }

      return { tpl, score };
    });

    // Filter out invalid items and sort descending
    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((item) => item.tpl);
  }

  /**
   * Get all templates by category
   */
  getTemplatesByCategory(category: InterviewCategory): QuestionTemplate[] {
    return this.templates.filter((t) => t.category === category);
  }

  /**
   * Count total questions in bank
   */
  getTotalCount(): number {
    return this.templates.length;
  }

  // --------------------------------------------------------------------------
  // QUESTION BANK SEEDING
  // --------------------------------------------------------------------------
  private initializeQuestionBank() {
    this.templates = [
      // ----------------------------------------------------------------------
      // 1. TECHNICAL DEEP DIVE (BACKEND, FRONTEND, DB, DEVOPS)
      // ----------------------------------------------------------------------
      {
        id: 'tech-nestjs-arch',
        category: 'TECHNICAL_DEEP_DIVE',
        skillOrCompetency: 'NestJS',
        difficulty: 'HARD',
        templateQuestion:
          'Trong dự án sử dụng NestJS, bạn tổ chức kiến trúc Dependency Injection, Modules và xử lý Cross-Cutting Concerns (Interceptors, Exception Filters, Guards) như thế nào?',
        purpose: 'Đánh giá mức độ am hiểu chuyên sâu về kiến trúc Modular và design pattern trong NestJS.',
        expectedCriteria: [
          'Giải thích cơ chế Inversion of Control (IoC) container và custom providers',
          'Cách áp dụng Guards cho authentication/authorization',
          'Sử dụng Interceptors để transform response hoặc logging',
        ],
        rubricLevels: {
          poor: 'Chỉ biết tạo controller/service cơ bản, chưa hiểu rõ DI lifecycle và Middleware/Interceptors.',
          acceptable: 'Biết cấu hình Module, Service, Controller và sử dụng AuthGuard hoặc ValidationPipe chuẩn.',
          excellent: 'Trình bày xuất sắc Custom Decorators, Dynamic Modules (forRoot/register), Scope (TRANSIENT, REQUEST) và xử lý transaction đa tầng.',
        },
        tags: ['nestjs', 'typescript', 'architecture', 'backend', 'di'],
      },
      {
        id: 'tech-nodejs-eventloop',
        category: 'TECHNICAL_DEEP_DIVE',
        skillOrCompetency: 'Node.js',
        difficulty: 'MEDIUM',
        templateQuestion:
          'Khi xây dựng hệ thống chịu tải cao bằng Node.js, bạn làm thế nào để tránh chặn Event Loop và tối ưu hóa xử lý bất đồng bộ?',
        purpose: 'Kiểm tra hiểu biết cốt lõi về runtime Node.js và xử lý high concurrency.',
        expectedCriteria: [
          'Phân biệt microtasks (process.nextTick, Promise) và macrotasks (setTimeout, setImmediate, I/O)',
          'Chiến lược tách heavy computation ra Worker Threads hoặc BullMQ background job',
          'Quản lý memory leak và profiling CPU bằng heap snapshot',
        ],
        rubricLevels: {
          poor: 'Chỉ giải thích được async/await bề mặt, không biết Event Loop gồm các phase nào.',
          acceptable: 'Hiểu cơ chế single-thread non-blocking I/O và biết tránh các hàm đồng bộ nặng như fs.readFileSync.',
          excellent: 'Phân tích chi tiết 6 phases của libuv Event Loop, sử dụng Worker Threads / Clustering và streaming buffer cho file lớn.',
        },
        tags: ['node.js', 'nodejs', 'javascript', 'backend', 'performance', 'eventloop'],
      },
      {
        id: 'tech-react-perf',
        category: 'TECHNICAL_DEEP_DIVE',
        skillOrCompetency: 'React',
        difficulty: 'MEDIUM',
        templateQuestion:
          'Khi ứng dụng React gặp tình trạng re-render liên tục gây chậm giao diện, bạn tiếp cận đo lường và tối ưu hóa performance như thế nào?',
        purpose: 'Đánh giá năng lực tối ưu giao diện Frontend và hiểu biết về Virtual DOM reconciliation.',
        expectedCriteria: [
          'Sử dụng React DevTools Profiler để xác định component render thừa',
          'Sử dụng hợp lý React.memo, useMemo, useCallback và tránh premature optimization',
          'Kỹ thuật Virtualization (react-window/react-virtualized) cho danh sách dữ liệu lớn',
        ],
        rubricLevels: {
          poor: 'Chỉ đề xuất dùng useMemo cho mọi biến mà không hiểu bản chất overhead của memoization.',
          acceptable: 'Sử dụng Profiler, phân biệt được render vs commit phase và áp dụng memoization đúng chỗ.',
          excellent: 'Tối ưu hóa State Colocation, áp dụng Server Components hoặc Concurrent rendering (useTransition, useDeferredValue) hiệu quả.',
        },
        tags: ['react', 'reactjs', 'frontend', 'javascript', 'performance'],
      },
      {
        id: 'tech-mongodb-index',
        category: 'TECHNICAL_DEEP_DIVE',
        skillOrCompetency: 'MongoDB',
        difficulty: 'HARD',
        templateQuestion:
          'Bạn thiết kế chiến lược đánh Index và cấu trúc Document trong MongoDB thế nào khi collection có hàng triệu bản ghi và cần query phức tạp?',
        purpose: 'Kiểm tra năng lực thiết kế cơ sở dữ liệu NoSQL, tránh index bloat và tối ưu executionStats.',
        expectedCriteria: [
          'Áp dụng quy tắc ESR (Equality, Sort, Range) khi tạo Compound Index',
          'Phân tích explain("executionStats") để kiểm tra index scan (IXSCAN) vs collection scan (COLLSCAN)',
          'Cân nhắc embedding vs referencing dựa trên write/read ratio',
        ],
        rubricLevels: {
          poor: 'Chỉ biết tạo single index cơ bản, không biết đọc explain plan.',
          acceptable: 'Hiểu compound index và biết sử dụng index prefix để tái sử dụng.',
          excellent: 'Nắm vững ESR rule, Covered Queries, Partial Indexes, TTL Index và Sharding key strategy.',
        },
        tags: ['mongodb', 'database', 'nosql', 'performance', 'indexing'],
      },
      {
        id: 'tech-docker-k8s',
        category: 'TECHNICAL_DEEP_DIVE',
        skillOrCompetency: 'Docker',
        difficulty: 'MEDIUM',
        templateQuestion:
          'Trong quá trình đóng gói ứng dụng bằng Docker, bạn đã áp dụng những kỹ thuật nào để tối ưu kích thước image và đảm bảo an toàn bảo mật?',
        purpose: 'Đánh giá kỹ năng container hóa và tư duy DevOps thực chiến.',
        expectedCriteria: [
          'Sử dụng Multi-stage builds để loại bỏ build dependencies',
          'Chọn base image tối giản (Alpine hoặc Distroless)',
          'Không chạy container với quyền root và tối ưu caching layer',
        ],
        rubricLevels: {
          poor: 'Viết Dockerfile một stage đơn giản, image dung lượng hàng GB và chạy root.',
          acceptable: 'Sử dụng multi-stage build, tách production node_modules và tối ưu thứ tự COPY.',
          excellent: 'Sử dụng Distroless image, Non-root user, .dockerignore chuẩn, scan vulnerabilities với Trivy/Snyk.',
        },
        tags: ['docker', 'devops', 'container', 'ci/cd', 'security'],
      },
      {
        id: 'tech-postgresql-trans',
        category: 'TECHNICAL_DEEP_DIVE',
        skillOrCompetency: 'PostgreSQL',
        difficulty: 'HARD',
        templateQuestion:
          'Bạn xử lý bài toán Transaction và tranh chấp dữ liệu (Concurrency Control / Race Condition) trong cơ sở dữ liệu quan hệ như thế nào?',
        purpose: 'Kiểm tra hiểu biết về ACID, Transaction Isolation Levels và Lock mechanisms.',
        expectedCriteria: [
          'Phân biệt các mức Isolation: Read Committed, Repeatable Read, Serializable',
          'Áp dụng Optimistic Locking (versioning) vs Pessimistic Locking (SELECT FOR UPDATE)',
          'Phòng ngừa và xử lý Deadlock trong distributed transactions',
        ],
        rubricLevels: {
          poor: 'Chỉ biết câu lệnh BEGIN/COMMIT thông thường, không biết race condition là gì.',
          acceptable: 'Biết dùng transaction và phân biệt được Optimistic vs Pessimistic locking.',
          excellent: 'Phân tích sâu hiện tượng Phantom Read, Serialization Anomaly và giải pháp 2PC/Saga pattern.',
        },
        tags: ['postgresql', 'sql', 'database', 'transactions', 'backend'],
      },

      // ----------------------------------------------------------------------
      // 2. SKILL GAP PROBING (KHOẢNG TRỐNG KỸ NĂNG SO VỚI JD)
      // ----------------------------------------------------------------------
      {
        id: 'gap-docker-foundation',
        category: 'SKILL_GAP',
        skillOrCompetency: 'Docker',
        difficulty: 'EASY',
        templateQuestion:
          'Vị trí này yêu cầu sử dụng Docker để đồng bộ môi trường phát triển và deploy. Dù CV của bạn chưa nêu nhiều về Docker, bạn có thể chia sẻ hiểu biết cơ bản về Container vs Virtual Machine không?',
        purpose: 'Khảo sát nền tảng và khả năng tiếp cận nhanh công nghệ mới khi ứng viên chưa có kinh nghiệm thực tế.',
        expectedCriteria: [
          'Khái niệm cô lập tài nguyên (namespaces, cgroups) so với Hypervisor',
          'Ý nghĩa của file docker-compose.yml khi chạy nhiều services cục bộ',
          'Thái độ cởi mở và kế hoạch học hỏi nhanh công nghệ container',
        ],
        rubricLevels: {
          poor: 'Không phân biệt được Docker với máy ảo VirtualBox, từ chối hoặc lúng túng.',
          acceptable: 'Nêu được Docker nhẹ hơn vì dùng chung OS kernel, đã từng dùng docker run cơ bản.',
          excellent: 'Trình bày mạch lạc bản chất kernel isolation, thể hiện tư duy học hỏi nhanh và sẵn sàng adapt.',
        },
        tags: ['docker', 'gap', 'devops', 'learning-curve'],
      },
      {
        id: 'gap-typescript-migration',
        category: 'SKILL_GAP',
        skillOrCompetency: 'TypeScript',
        difficulty: 'MEDIUM',
        templateQuestion:
          'Dự án của chúng tôi viết 100% bằng TypeScript. Với nền tảng JavaScript vững chắc của bạn, bạn đã từng làm việc với Type System hoặc Static Typing chưa, và bạn nhìn nhận lợi ích/thách thức khi chuyển đổi sang TypeScript là gì?',
        purpose: 'Đánh giá khả năng chuyển giao kỹ năng từ JavaScript thuần sang TypeScript.',
        expectedCriteria: [
          'Lợi ích phát hiện lỗi sớm tại compile-time thay vì runtime',
          'Hiểu các khái niệm Types, Interfaces, Generics, Type Narrowing',
          'Kinh nghiệm vượt qua rào cản type overhead ban đầu',
        ],
        rubricLevels: {
          poor: 'Xem thường việc dùng type, lạm dụng `any` hoặc không thấy giá trị của Static Typing.',
          acceptable: 'Hiểu giá trị của Typescript cho dự án lớn, biết khai báo interface và types cơ bản.',
          excellent: 'Hiểu Generics, Utility Types (Partial, Pick, Omit), Strict mode và tư duy Type-driven development.',
        },
        tags: ['typescript', 'javascript', 'gap', 'typing'],
      },
      {
        id: 'gap-redis-caching',
        category: 'SKILL_GAP',
        skillOrCompetency: 'Redis',
        difficulty: 'MEDIUM',
        templateQuestion:
          'Trong hệ thống hiện tại, chúng tôi sử dụng Redis để làm In-Memory Cache và Rate Limiter. Bạn đã từng tiếp cận giải pháp caching nào và chiến lược Cache Invalidation bạn sẽ chọn là gì?',
        purpose: 'Kiểm tra tư duy về Performance Caching khi ứng viên chưa liệt kê Redis trong CV.',
        expectedCriteria: [
          'Hiểu chiến lược Cache-Aside, Write-Through, Write-Behind',
          'Xử lý Cache Invalidation (TTL, Event-driven invalidation)',
          'Nguy cơ Cache Stampede / Dog-piling và cách phòng chống',
        ],
        rubricLevels: {
          poor: 'Chưa từng nghe về In-memory cache hoặc không biết khi nào cần invalidate cache.',
          acceptable: 'Hiểu mô hình Cache-Aside (đọc cache trước, nếu miss thì đọc DB rồi ghi cache có TTL).',
          excellent: 'Phân tích được Cache Stampede, sử dụng Distributed Locks (Redlock) hoặc Redis Pub/Sub linh hoạt.',
        },
        tags: ['redis', 'caching', 'gap', 'performance'],
      },

      // ----------------------------------------------------------------------
      // 3. CLARIFICATION & VERIFICATION (XÁC MINH HỒ SƠ & BẤT THƯỜNG)
      // ----------------------------------------------------------------------
      {
        id: 'clarify-project-role',
        category: 'CLARIFICATION',
        skillOrCompetency: 'Project Role',
        difficulty: 'MEDIUM',
        templateQuestion:
          'Trong dự án quy mô lớn được nêu trong CV với nhiều thành viên, bạn có thể nêu rõ vai trò trực tiếp và những module cụ thể mà bạn là người thiết kế hoặc chịu trách nhiệm chính không?',
        purpose: 'Xác minh sự đóng góp thực chất của ứng viên, tránh trường hợp "claim" công sức của cả team.',
        expectedCriteria: [
          'Mô tả rõ ràng phạm vi phân công công việc cụ thể của bản thân',
          'Nêu các quyết định kỹ thuật tự mình đưa ra',
          'Các thách thức trực tiếp đối mặt và kết quả nghiệm thu',
        ],
        rubricLevels: {
          poor: 'Trả lời mơ hồ bằng đại từ chung "chúng tôi làm", không chỉ ra được dòng code hoặc module cụ thể nào do mình viết.',
          acceptable: 'Nêu rõ được tính năng mình code, API endpoint mình thiết kế và phối hợp với team ra sao.',
          excellent: 'Trình bày rành mạch từ requirement analysis, sơ đồ kiến trúc module mình phụ trách, số liệu kết quả rõ ràng.',
        },
        tags: ['verification', 'project', 'clarification', 'ownership'],
      },
      {
        id: 'clarify-employment-transition',
        category: 'CLARIFICATION',
        skillOrCompetency: 'Career Trajectory',
        difficulty: 'EASY',
        templateQuestion:
          'Qua theo dõi lịch sử làm việc của bạn, có khoảng thời gian bạn chuyển đổi giữa các vị trí/công ty. Bạn có thể chia sẻ về lý do cho sự thay đổi này và bài học kinh nghiệm lớn nhất bạn đúc kết được?',
        purpose: 'Đánh giá tính trung thực, định hướng nghề nghiệp và sự ổn định gắn bó của ứng viên.',
        expectedCriteria: [
          'Giải thích tích cực, chuyên nghiệp, không nói xấu công ty cũ',
          'Định hướng nghề nghiệp nhất quán và có chủ đích',
          'Sự trưởng thành sau mỗi bước chuyển đổi',
        ],
        rubricLevels: {
          poor: 'Đổ lỗi cho đồng nghiệp/quản lý cũ, thái độ tiêu cực hoặc lý do nhảy việc bốc đồng.',
          acceptable: 'Giải thích lịch sự, hợp lý về mong muốn tìm kiếm thử thách mới phù hợp với định hướng.',
          excellent: 'Chia sẻ sâu sắc về sự tự nhận thức (self-awareness), lộ trình phát triển rõ ràng và mục tiêu lâu dài.',
        },
        tags: ['career', 'clarification', 'soft-skill', 'transition'],
      },

      // ----------------------------------------------------------------------
      // 4. BEHAVIORAL & SITUATIONAL (STAR FRAMEWORK)
      // ----------------------------------------------------------------------
      {
        id: 'star-production-incident',
        category: 'BEHAVIORAL_STAR',
        skillOrCompetency: 'Problem Solving',
        difficulty: 'HARD',
        templateQuestion:
          'Hãy kể lại một sự cố nghiêm trọng trên môi trường Production (như sập server, nghẽn database, leak dữ liệu) mà bạn từng trực tiếp tham gia xử lý theo mô hình STAR (Tình huống, Nhiệm vụ, Hành động, Kết quả)?',
        purpose: 'Đánh giá khả năng giữ bình tĩnh, quy trình xử lý sự cố (Incident Management) và văn hóa Blameless Post-mortem.',
        expectedCriteria: [
          'Situation: Bối cảnh sự cố và mức độ ảnh hưởng',
          'Task: Nhiệm vụ khẩn cấp cần giải quyết (hotfix, rollback hay mitigate)',
          'Action: Các bước điều tra root cause (logs, metrics) và hành động khắc phục',
          'Result: Thời gian phục hồi, bài học và cơ chế phòng ngừa lặp lại',
        ],
        rubricLevels: {
          poor: 'Chưa từng gặp sự cố hoặc lúng túng hoảng loạn, không có phương pháp điều tra log hệ thống.',
          acceptable: 'Kể được sự cố thực tế, biết ưu tiên khôi phục dịch vụ trước (rollback/restart) rồi mới fix bug.',
          excellent: 'Áp dụng xuất sắc mô hình STAR: Có metrics đo lường, viết Post-mortem tài liệu hóa và bổ sung alert giám sát.',
        },
        tags: ['star', 'behavioral', 'incident', 'production', 'troubleshooting'],
      },
      {
        id: 'star-technical-conflict',
        category: 'BEHAVIORAL_STAR',
        skillOrCompetency: 'Collaboration & Communication',
        difficulty: 'MEDIUM',
        templateQuestion:
          'Hãy chia sẻ một tình huống bạn và Tech Lead hoặc đồng nghiệp có quan điểm trái ngược nhau gay gắt về một giải pháp kiến trúc hoặc công nghệ. Bạn đã tiếp cận giải quyết bất đồng đó như thế nào?',
        purpose: 'Đánh giá trí tuệ cảm xúc (EQ), kỹ năng đàm phán dựa trên dữ liệu/PoC và tinh thần vì mục tiêu chung.',
        expectedCriteria: [
          'Tôn trọng quan điểm khác biệt, lắng nghe lập luận của đối phương',
          'Sử dụng Proof of Concept (PoC) hoặc Benchmark số liệu để chứng minh thay vì cãi lý thuyết',
          'Tinh thần "Disagree and Commit" khi quyết định cuối cùng được đưa ra',
        ],
        rubricLevels: {
          poor: 'Cố chấp bảo vệ ý kiến cá nhân bằng cảm xúc hoặc thụ động buông xuôi bất mãn.',
          acceptable: 'Biết ngồi lại trao đổi chuyên môn, so sánh ưu nhược điểm để thống nhất giải pháp.',
          excellent: 'Chủ động làm prototype/benchmark đo đạc thực tế, thuyết phục bằng số liệu và giữ vững tinh thần đoàn kết.',
        },
        tags: ['star', 'behavioral', 'communication', 'conflict-resolution', 'teamwork'],
      },
      {
        id: 'star-tight-deadline',
        category: 'BEHAVIORAL_STAR',
        skillOrCompetency: 'Ownership & Time Management',
        difficulty: 'MEDIUM',
        templateQuestion:
          'Khi dự án đứng trước thời hạn bàn giao rất gấp nhưng yêu cầu sản phẩm lại thay đổi đột xuất, bạn đã làm gì để quản lý khối lượng công việc và đảm bảo chất lượng giao hàng?',
        purpose: 'Đánh giá năng lực sắp xếp thứ tự ưu tiên (Triage), thương lượng phạm vi (Scope negotiation) và tinh thần trách nhiệm.',
        expectedCriteria: [
          'Phân loại công việc theo mức độ quan trọng (Must-have vs Nice-to-have)',
          'Giao tiếp minh bạch với Project Manager / Product Owner về trade-offs',
          'Không cắt giảm bừa bãi khâu kiểm thử dẫn đến technical debt nghiêm trọng',
        ],
        rubricLevels: {
          poor: 'Làm ẩu bỏ qua kiểm thử, giấu lỗi hoặc để trễ hạn mà không báo trước cho team.',
          acceptable: 'Báo cáo sớm nguy cơ trễ hạn, đề xuất cắt bớt tính năng phụ để kịp bàn giao core feature.',
          excellent: 'Áp dụng ma trận ưu tiên xuất sắc, chủ động đề xuất giải pháp MVP tối ưu và duy trì chất lượng release ổn định.',
        },
        tags: ['star', 'behavioral', 'deadline', 'ownership', 'prioritization'],
      },
    ];

    // Compute deterministic embeddings for all templates to enable semantic vector retrieval
    for (const tpl of this.templates) {
      const textToEmbed = `${tpl.skillOrCompetency} ${tpl.templateQuestion} ${tpl.purpose} ${tpl.tags.join(' ')}`;
      tpl.embedding = CosineSimilarityUtil.generateDeterministicEmbedding(textToEmbed);
    }
  }
}

