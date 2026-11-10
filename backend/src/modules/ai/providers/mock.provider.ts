import { Injectable, Logger } from '@nestjs/common';
import { StandardCvProfile, StandardWorkExperience } from '../interfaces/standard-cv.interface';
import { AiExtractionResult, IAiProvider } from '../interfaces/ai-provider.interface';
import { CandidateSanitizerUtil, TECH_SYNONYM_DICTIONARY } from '../utils/candidate-sanitizer.util';

@Injectable()
export class MockAiProvider implements IAiProvider {
  readonly name = 'Mock LLM Provider';
  private readonly logger = new Logger(MockAiProvider.name);

  isAvailable(): boolean {
    return true;
  }

  async extractCv(cleanedText: string): Promise<AiExtractionResult> {
    this.logger.log('Executing MockAiProvider for CV extraction (fallback/offline mode)');

    const emailMatch = cleanedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = cleanedText.match(/(?:\+84|84|0)[\s\.\-]?[1-9][0-9\.\-\s]{7,14}/);

    
    const lines = cleanedText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let extractedName = 'Nguyễn Văn A';
    const ignoreNameRegex =
      /^(cv|curriculum vitae|resume|hồ sơ|vị trí|mục tiêu|kinh nghiệm|kỹ năng|summary|skills|experience|education|email|sđt|phone|senior|junior|lead|full\s*stack|backend|frontend|software|developer|engineer|kỹ sư|lập trình)/i;

    for (let i = 0; i < Math.min(lines.length, 6); i++) {
      const line = lines[i].replace(/^(họ và tên|họ tên|full name|name)\s*[:-]?\s*/i, '').trim();
      if (
        line.length >= 3 &&
        line.length <= 50 &&
        !line.includes('@') &&
        !line.includes('http') &&
        !ignoreNameRegex.test(line)
      ) {
        extractedName = line;
        break;
      }
    }

  
    const foundTechSkillsSet = new Set<string>();
    const dictKeys = Object.keys(TECH_SYNONYM_DICTIONARY).sort((a, b) => b.length - a.length);

    for (const key of dictKeys) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
     
      const regex = /^[a-zA-Z0-9]+$/.test(key)
        ? new RegExp(`\\b${escaped}\\b`, 'i')
        : new RegExp(`(?:^|\\s|[,;\\-\\(])${escaped}(?:$|\\s|[,;\\-\\)])`, 'i');

      if (regex.test(cleanedText)) {
        foundTechSkillsSet.add(TECH_SYNONYM_DICTIONARY[key]);
      }
    }

    
    const additionalKeywords = [
      'TypeScript',
      'JavaScript',
      'Python',
      'Java',
      'Flutter',
      'React Native',
      'Firebase',
      'SQLite',
      'Tailwind CSS',
    ];
    for (const kw of additionalKeywords) {
      if (new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i').test(cleanedText)) {
        foundTechSkillsSet.add(kw);
      }
    }

    const foundTechSkills = Array.from(foundTechSkillsSet);

 
    let expText = cleanedText;
    const expSectionMatch = cleanedText.match(
      /(?:kinh nghiệm|experience|work history|lịch sử công tác)[\s\S]*?(?=(?:học vấn|education|chứng chỉ|certifications|dự án|projects|kỹ năng|skills|$))/i,
    );
    if (expSectionMatch) {
      expText = expSectionMatch[0];
    }

    const dateIntervalRegex =
      /(\d{1,2}\/\d{4}|\d{4}-\d{1,2}|\d{4})\s*[-–—to\s]+\s*(\d{1,2}\/\d{4}|\d{4}-\d{1,2}|\d{4}|present|hiện tại|nay|current)/gi;

    const workExperiences: StandardWorkExperience[] = [];
    let match: RegExpExecArray | null;

    while ((match = dateIntervalRegex.exec(expText)) !== null) {
      const rawStart = match[1].trim();
      const rawEnd = match[2].trim();
      const isCurrent = /^(present|hiện tại|nay|current)$/i.test(rawEnd);

     
      let normStart = rawStart;
      if (/^\d{1,2}\/\d{4}$/.test(rawStart)) {
        const [m, y] = rawStart.split('/');
        normStart = `${y}-${m.padStart(2, '0')}`;
      }

      let normEnd = isCurrent ? 'Present' : rawEnd;
      if (!isCurrent && /^\d{1,2}\/\d{4}$/.test(rawEnd)) {
        const [m, y] = rawEnd.split('/');
        normEnd = `${y}-${m.padStart(2, '0')}`;
      }

      workExperiences.push({
        company: 'Technology Partner Corp',
        role: 'Software Engineer',
        location: 'Việt Nam',
        startDate: normStart,
        endDate: normEnd,
        isCurrent,
        description: 'Phát triển và vận hành hệ thống phần mềm nghiệp vụ.',
        responsibilities: ['Phát triển tính năng và tối ưu hóa hệ thống'],
        achievements: ['Hoàn thành dự án đúng hạn với chất lượng cao'],
        techStack: foundTechSkills.slice(0, 4),
      });
    }

  
    if (workExperiences.length === 0) {
      workExperiences.push({
        company: 'Tech Solutions Corp',
        role: 'Software Engineer',
        location: 'Hà Nội',
        startDate: '2022-01',
        endDate: 'Present',
        isCurrent: true,
        durationMonths: 24,
        description: 'Tham gia thiết kế và xây dựng các module backend NestJS và frontend React.',
        responsibilities: ['Phát triển RESTful APIs và tối ưu hóa cơ sở dữ liệu'],
        achievements: ['Cải thiện tốc độ phản hồi API 35%'],
        techStack: foundTechSkills.slice(0, 4),
      });
    }

    const calculatedYears = CandidateSanitizerUtil.mergeWorkIntervals(workExperiences);
    const isVietnamese = /[\u00C0-\u1EF9]/i.test(cleanedText);

    const profile: StandardCvProfile = {
      _reasoning: {
        detectedNameRationale: `Đã trích xuất tên ứng viên "${extractedName}" từ phần đầu văn bản`,
        timelineDeduplication: `Khoảng thời gian kinh nghiệm tính toán hợp nhất không trùng lặp: ${calculatedYears} năm`,
        languageDetected: isVietnamese ? 'vi' : 'en',
      },
      personalInfo: {
        fullName: extractedName,
        email: emailMatch ? emailMatch[0].toLowerCase() : null,
        phone: phoneMatch ? CandidateSanitizerUtil.sanitizePhone(phoneMatch[0]) : null,
        location: isVietnamese ? 'Hà Nội, Việt Nam' : 'San Francisco, CA',
        linkedin: 'https://linkedin.com/in/candidate',
        github: 'https://github.com/candidate',
        portfolioUrl: null,
        currentTitle: 'Software Engineer',
      },
      summary:
        cleanedText.length > 50
          ? cleanedText.slice(0, 300).replace(/\s+/g, ' ') + '...'
          : 'Lập trình viên nhiệt huyết với kinh nghiệm phát triển các hệ thống phần mềm hiệu năng cao.',
      yearsOfExperience: calculatedYears,
      skills: {
        technicalSkills:
          foundTechSkills.length > 0 ? foundTechSkills : ['TypeScript', 'Node.js', 'MongoDB', 'React'],
        softSkills: ['Kỹ năng giao tiếp', 'Làm việc nhóm', 'Giải quyết vấn đề'],
        toolsAndPlatforms: ['Git', 'Docker', 'Postman'],
      },
      workExperience: workExperiences,
      education: [
        {
          institution: isVietnamese ? 'Đại học Bách Khoa' : 'University of California, Berkeley',
          degree: isVietnamese ? 'Kỹ sư' : 'Bachelor of Science',
          fieldOfStudy: isVietnamese ? 'Công nghệ Thông tin' : 'Computer Science',
          startDate: '2017',
          endDate: '2021',
          graduationYear: '2021',
          gpa: '3.4/4.0',
        },
      ],
      certifications: [
        {
          name: 'AWS Certified Cloud Practitioner',
          issuer: 'Amazon Web Services',
          issueDate: '2023',
          expiryDate: '2026',
          credentialUrl: null,
        },
      ],
      languages: [
        {
          language: 'Tiếng Việt',
          proficiency: 'Bản ngữ',
        },
        {
          language: 'English',
          proficiency: 'Professional',
        },
      ],
      projects: [
        {
          projectName: 'Smart HR Candidate Screening',
          role: 'Backend Developer',
          description: 'Hệ thống bóc tách CV và đánh giá hồ sơ ứng viên sử dụng AI',
          startDate: '2024-01',
          endDate: 'Present',
          techStack: ['NestJS', 'TypeScript', 'MongoDB'],
          projectUrl: 'https://github.com/project',
        },
      ],
    };

    return {
      profile,
      modelUsed: 'mock-llm-fallback',
      tokensUsed: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      confidenceScore: 85,
    };
  }

 
  async generateEmbedding(text: string): Promise<number[]> {
   
    const dimensions = 128;
    const vector = new Array(dimensions).fill(0);
    if (!text || text.trim() === '') {
      return vector;
    }

    const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = clean.split(/\s+/).filter(t => t.length > 0);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      let hash = 0;
      for (let j = 0; j < token.length; j++) {
        hash = (hash << 5) - hash + token.charCodeAt(j);
        hash |= 0;
      }
      const index = Math.abs(hash) % dimensions;
      vector[index] += 1;

      if (i < tokens.length - 1) {
        const bigram = `${token}_${tokens[i + 1]}`;
        let biHash = 0;
        for (let j = 0; j < bigram.length; j++) {
          biHash = (biHash << 5) - biHash + bigram.charCodeAt(j);
          biHash |= 0;
        }
        const biIndex = Math.abs(biHash) % dimensions;
        vector[biIndex] += 1.5;
      }
    }

    let sumSquares = 0;
    for (const val of vector) {
      sumSquares += val * val;
    }
    const norm = Math.sqrt(sumSquares);
    if (norm > 0) {
      for (let k = 0; k < vector.length; k++) {
        vector[k] = Math.round((vector[k] / norm) * 10000) / 10000;
      }
    }
    return vector;
  }

  
  async generateInterviewQuestions(context: any): Promise<any> {
    this.logger.log('Executing MockAiProvider for Interview Question Generation');

    const jobTitle = context.jobTitle || 'Software Engineer';
    const candidateName = context.candidateName || 'Ứng viên';
    const primarySkills = context.candidateSkills && context.candidateSkills.length > 0
      ? context.candidateSkills
      : ['TypeScript', 'Node.js', 'React'];
    const missingSkills = context.missingSkills || [];
    const projects = context.candidateProjects || [];

    const questions: any[] = [];
    let qId = 1;

   
    const firstProject = projects[0];
    const projectContext = firstProject
      ? `Trong CV bạn có liệt kê dự án "${firstProject.title}" đảm nhận vai trò "${firstProject.role || 'Thành viên'}" với công nghệ ${(firstProject.technologies || []).slice(0, 3).join(', ')}`
      : `Trong lịch sử làm việc của bạn ở vị trí ${jobTitle}`;

    questions.push({
      id: `q-${qId++}`,
      category: 'CLARIFICATION',
      question: `${projectContext}, bạn có thể làm rõ vai trò trực tiếp của bạn trong khâu thiết kế kiến trúc và giải pháp kỹ thuật lớn nhất do chính bạn khởi xướng là gì?`,
      purpose: 'Xác minh sự đóng góp thực tế và năng lực chủ động giải quyết vấn đề của ứng viên trong dự án.',
      difficulty: 'MEDIUM',
      relatedSkill: primarySkills[0] || 'System Architecture',
      contextFromCV: projectContext,
      expectedKeyPoints: [
        'Nêu rõ ranh giới trách nhiệm cá nhân so với toàn team',
        'Giải thích quyết định kỹ thuật do mình đề xuất và bảo vệ',
        'Số liệu hoặc kết quả nghiệm thu thực tế',
      ],
      sampleRubric: {
        poor: 'Chỉ trả lời chung chung theo kiểu "team em làm", không nói rõ phần việc của mình.',
        acceptable: 'Nêu được module mình phụ trách và API/tính năng mình tự tay code.',
        excellent: 'Trình bày rành mạch từ khâu phân tích yêu cầu, lựa chọn công nghệ đến đo lường kết quả.',
      },
    });

   
    const techSkill1 = primarySkills[0] || 'Node.js';
    questions.push({
      id: `q-${qId++}`,
      category: 'TECHNICAL_DEEP_DIVE',
      question: `Với kinh nghiệm sử dụng ${techSkill1} trong các dự án trước đây, bạn đã áp dụng những chiến lược nào để tối ưu hiệu năng và xử lý tải cao?`,
      purpose: `Đánh giá mức độ thành thạo và năng lực tối ưu hóa chuyên sâu với ${techSkill1}.`,
      difficulty: 'HARD',
      relatedSkill: techSkill1,
      contextFromCV: `Kỹ năng ${techSkill1} được ứng viên nhấn mạnh trong hồ sơ kinh nghiệm.`,
      expectedKeyPoints: [
        `Các mẫu thiết kế (Design patterns) áp dụng với ${techSkill1}`,
        'Kỹ thuật profiling, phát hiện bottleneck và quản lý bộ nhớ/kết nối',
        'Chiến lược caching hoặc asynchronous processing',
      ],
      sampleRubric: {
        poor: 'Chỉ nêu được cú pháp hoặc thư viện cơ bản, không phân tích được hiệu năng.',
        acceptable: 'Hiểu các phương pháp tối ưu thông thường và tránh các anti-patterns phổ biến.',
        excellent: 'Phân tích sâu sắc kiến trúc bên dưới, cơ chế concurrency và giải pháp quy mô lớn.',
      },
    });

    if (primarySkills.length > 1) {
      const techSkill2 = primarySkills[1];
      questions.push({
        id: `q-${qId++}`,
        category: 'TECHNICAL_DEEP_DIVE',
        question: `Khi làm việc với ${techSkill2}, bạn đã từng gặp bài toán khó nào về tích hợp hoặc xử lý lỗi bất đồng bộ và cách bạn khắc phục triệt để?`,
        purpose: `Kiểm tra kinh nghiệm thực chiến và xử lý sự cố nâng cao với ${techSkill2}.`,
        difficulty: 'MEDIUM',
        relatedSkill: techSkill2,
        contextFromCV: `Ứng viên có kinh nghiệm với ${techSkill2} theo danh mục kỹ năng CV.`,
        expectedKeyPoints: [
          'Nhận diện đúng nguyên nhân gốc rễ (Root Cause Analysis)',
          'Phương pháp debug và kiểm thử hồi quy (Regression Testing)',
          'Thiết kế cơ chế tự phục hồi (Fault tolerance)',
        ],
        sampleRubric: {
          poor: 'Chưa từng gặp lỗi hoặc chỉ giải quyết tạm thời bằng cách restart/chắp vá.',
          acceptable: 'Mô tả được lỗi thực tế, cách đọc log và giải pháp khắc phục logic.',
          excellent: 'Trình bày bài bản quy trình RCA, bổ sung giám sát và automated tests để không lặp lại.',
        },
      });
    }

    
    if (missingSkills.length > 0) {
      const gapSkill = missingSkills[0];
      questions.push({
        id: `q-${qId++}`,
        category: 'SKILL_GAP',
        question: `Vị trí ${jobTitle} yêu cầu kinh nghiệm với ${gapSkill}, tuy nhiên CV của bạn chưa thể hiện rõ về công nghệ này. Bạn có thể chia sẻ kiến thức nền tảng bạn đã tìm hiểu và lộ trình bạn sẽ tiếp cận để làm chủ ${gapSkill} nhanh nhất?`,
        purpose: `Đánh giá tinh thần cầu tiến, khả năng tự học và mức độ hiểu biết khái niệm cơ bản về ${gapSkill}.`,
        difficulty: 'MEDIUM',
        relatedSkill: gapSkill,
        contextFromCV: `Kỹ năng ${gapSkill} được yêu cầu trong JD nhưng chưa tìm thấy trong hồ sơ ứng viên.`,
        expectedKeyPoints: [
          `Nắm vững khái niệm và mục đích sử dụng cốt lõi của ${gapSkill}`,
          'Khả năng liên hệ kiến thức tương đồng từ các công nghệ đã biết',
          'Kế hoạch hành động cụ thể để bắt kịp yêu cầu công việc trong 1-2 tuần đầu',
        ],
        sampleRubric: {
          poor: 'Thừa nhận không biết và không có ý định tìm hiểu, hoặc từ chối trả lời.',
          acceptable: 'Nêu được khái niệm lý thuyết cơ bản và thể hiện thái độ sẵn sàng học hỏi.',
          excellent: 'So sánh được với công nghệ tương đương, phân tích được lý do doanh nghiệp dùng nó và có lộ trình học cụ thể.',
        },
      });
    } else {
      
      questions.push({
        id: `q-${qId++}`,
        category: 'SKILL_GAP',
        question: `Dù bạn đã đáp ứng đủ các kỹ năng bắt buộc của vị trí ${jobTitle}, trong hệ sinh thái mở rộng, chúng tôi rất quan tâm đến khả năng thích ứng với các công nghệ mới nổi. Bạn tự đánh giá mình học công nghệ mới nhanh như thế nào qua một ví dụ gần đây?`,
        purpose: 'Đo lường năng lực học tập liên tục (Continuous Learning) và khả năng thích ứng kỹ thuật.',
        difficulty: 'EASY',
        relatedSkill: 'Adaptability',
        contextFromCV: 'Ứng viên đáp ứng trọn vẹn các yêu cầu kỹ năng cốt lõi của JD.',
        expectedKeyPoints: [
          'Phương pháp tự học có hệ thống (đọc docs, làm PoC, tham khảo best practices)',
          'Thời gian thực tế để áp dụng vào công việc',
          'Tư duy chia sẻ lại kiến thức cho đồng đội',
        ],
        sampleRubric: {
          poor: 'Học thụ động, chỉ học khi bị ép buộc, không có ví dụ cụ thể.',
          acceptable: 'Có ví dụ tự học một framework/tool trong thời gian ngắn và áp dụng được.',
          excellent: 'Tư duy học sâu bản chất nguyên lý, làm PoC bài bản và chủ động đào tạo nội bộ.',
        },
      });
    }

  
    questions.push({
      id: `q-${qId++}`,
      category: 'BEHAVIORAL_STAR',
      question: `Hãy kể lại một sự cố kỹ thuật nghiêm trọng trên môi trường Production mà bạn từng đối mặt theo cấu trúc STAR: Tình huống phát sinh là gì, Nhiệm vụ ưu tiên, Hành động xử lý trực tiếp và Kết quả/Bài học thu được?`,
      purpose: 'Đánh giá khả năng kiểm soát áp lực, quy trình ứng cứu sự cố và tinh thần trách nhiệm.',
      difficulty: 'HARD',
      relatedSkill: 'Incident Management',
      contextFromCV: `Kinh nghiệm làm việc ${context.totalYearsExperience || 2} năm trong môi trường dự án phần mềm.`,
      expectedKeyPoints: [
        'Situation: Mô tả sự cố rõ ràng và mức độ ảnh hưởng',
        'Task: Ưu tiên cô lập và giảm thiểu thiệt hại cho người dùng',
        'Action: Điều tra nguyên nhân gốc rễ, phối hợp team và triển khai bản vá an toàn',
        'Result: Dịch vụ phục hồi, có tài liệu Post-mortem và giải pháp phòng ngừa lâu dài',
      ],
      sampleRubric: {
        poor: 'Lúng túng đổ lỗi cho hạ tầng/người khác, không có quy trình xử lý sự cố bài bản.',
        acceptable: 'Kể được sự cố thực tế, biết cách rollback hoặc apply hotfix nhanh chóng.',
        excellent: 'Áp dụng xuất sắc mô hình STAR: Có chỉ số MTTR, tổ chức Blameless Post-mortem và bổ sung alert giám sát tự động.',
      },
    });

    questions.push({
      id: `q-${qId++}`,
      category: 'BEHAVIORAL_STAR',
      question: `Khi đứng trước bất đồng quan điểm gay gắt với Tech Lead hoặc đồng nghiệp về một giải pháp kỹ thuật, bạn đã từng giải quyết tình huống đó như thế nào để vừa bảo vệ chất lượng sản phẩm vừa giữ vững tinh thần đoàn kết?`,
      purpose: 'Đánh giá trí tuệ cảm xúc, kỹ năng giao tiếp thuyết phục bằng số liệu và tinh thần "Disagree and Commit".',
      difficulty: 'MEDIUM',
      relatedSkill: 'Collaboration',
      contextFromCV: 'Kinh nghiệm phối hợp trong các nhóm phát triển đa chức năng.',
      expectedKeyPoints: [
        'Lắng nghe và tôn trọng góc nhìn của người khác',
        'Dùng dữ liệu, Benchmark hoặc PoC để chứng minh thay vì tranh luận cảm tính',
        'Tôn trọng quyết định chung và hướng tới mục tiêu của dự án',
      ],
      sampleRubric: {
        poor: 'Bảo thủ, tranh cãi gay gắt bằng cảm xúc hoặc tiêu cực rút lui không hợp tác.',
        acceptable: 'Biết ngồi lại phân tích ưu nhược điểm khách quan để tìm tiếng nói chung.',
        excellent: 'Chủ động làm prototype/benchmark thực tế để thuyết phục bằng dữ liệu, giữ vững tinh thần đồng đội xuất sắc.',
      },
    });

    return {
      questions: questions.slice(0, context.numQuestions || 6),
    };
  }


  async extractJdCriteria(rawDescription: string, jobTitle?: string): Promise<any> {
    this.logger.log('Executing MockAiProvider for Job Description Criteria Extraction');

    const combinedText = `${jobTitle || ''} ${rawDescription}`.toLowerCase();

  
    
    let seniorityLevel = 'MIDDLE';
    const titleLower = (jobTitle || '').toLowerCase();
    if (/(intern|thực tập|fresher)/i.test(titleLower)) {
      seniorityLevel = 'INTERN';
    } else if (/(lead|trưởng nhóm|manager|architect|quản lý|tech lead)/i.test(titleLower)) {
      seniorityLevel = 'LEAD';
    } else if (/(senior|chuyên gia|cao cấp)/i.test(titleLower)) {
      seniorityLevel = 'SENIOR';
    } else if (/(junior|entry)/i.test(titleLower)) {
      seniorityLevel = 'JUNIOR';
    } else {
     
      if (/(lead|trưởng nhóm|manager|architect|tech lead)/i.test(combinedText)) {
        seniorityLevel = 'LEAD';
      } else if (/(senior|chuyên gia|cao cấp|4-5 năm|5\+ năm)/i.test(combinedText)) {
        seniorityLevel = 'SENIOR';
      } else if (/(junior|mới đi làm|1-2 năm|entry level)/i.test(combinedText)) {
        seniorityLevel = 'JUNIOR';
      } else if (/(intern|thực tập|fresher)/i.test(combinedText)) {
        seniorityLevel = 'INTERN';
      }
    }


    let minExperienceYears = 2;
    const expMatch = combinedText.match(/(\d+)\s*(?:-|–|to)?\s*(\d+)?\s*(?:năm|years|nam|yr)/i);
    if (expMatch) {
      minExperienceYears = parseInt(expMatch[1], 10);
    } else {
      if (seniorityLevel === 'INTERN') minExperienceYears = 0;
      else if (seniorityLevel === 'JUNIOR') minExperienceYears = 1;
      else if (seniorityLevel === 'SENIOR') minExperienceYears = 4;
      else if (seniorityLevel === 'LEAD') minExperienceYears = 6;
    }

    const techDictionary: Record<string, string> = {
      'react': 'React',
      'reactjs': 'React',
      'node': 'Node.js',
      'nodejs': 'Node.js',
      'node.js': 'Node.js',
      'nestjs': 'NestJS',
      'nest.js': 'NestJS',
      'typescript': 'TypeScript',
      'javascript': 'JavaScript',
      'docker': 'Docker',
      'k8s': 'Kubernetes',
      'kubernetes': 'Kubernetes',
      'mongodb': 'MongoDB',
      'postgres': 'PostgreSQL',
      'postgresql': 'PostgreSQL',
      'mysql': 'MySQL',
      'redis': 'Redis',
      'aws': 'AWS',
      'python': 'Python',
      'java': 'Java',
      'golang': 'Go',
      'go': 'Go',
      'graphql': 'GraphQL',
      'rest api': 'REST API',
      'restful': 'REST API',
      'ci/cd': 'CI/CD',
      'git': 'Git',
    };

    const foundSkillsSet = new Set<string>();
    for (const [key, normalized] of Object.entries(techDictionary)) {
      const regex = new RegExp(`\\b${key.replace('.', '\\.')}\\b`, 'i');
      if (regex.test(combinedText)) {
        foundSkillsSet.add(normalized);
      }
    }

 
    const preferredSectionMatch = rawDescription.match(
      /(?:ưu tiên|điểm cộng|nice to have|plus|preferred|lợi thế)[\s\S]*?(?=(?:quyền lợi|chế độ|benefit|yêu cầu|$))/i,
    );
    const preferredText = preferredSectionMatch ? preferredSectionMatch[0].toLowerCase() : '';

    const requiredSkills: string[] = [];
    const preferredSkills: string[] = [];

    for (const skill of foundSkillsSet) {
      if (preferredText && preferredText.includes(skill.toLowerCase())) {
        preferredSkills.push(skill);
      } else {
        requiredSkills.push(skill);
      }
    }

   
    if (requiredSkills.length === 0) {
      requiredSkills.push('TypeScript', 'Node.js', 'NestJS');
    }
    if (preferredSkills.length === 0) {
      preferredSkills.push('Docker', 'MongoDB');
    }

  
    const lines = rawDescription
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^[•\-\*\+\d+\.]\s*/.test(l) && l.length > 15);

    const responsibilities = lines.length >= 2
      ? lines.slice(0, 5).map((l) => l.replace(/^[•\-\*\+\d+\.]\s*/, ''))
      : [
          'Tham gia thiết kế và phát triển các module phần mềm',
          'Viết clean code, unit test và phối hợp cùng đội ngũ kỹ thuật',
          'Tối ưu hóa hiệu năng và bảo trì hệ thống',
        ];

    return {
      requiredSkills,
      preferredSkills,
      minExperienceYears,
      requiredEducation: 'Cử nhân hoặc Kỹ sư chuyên ngành Công nghệ thông tin',
      responsibilities,
      seniorityLevel,
    };
  }
}
