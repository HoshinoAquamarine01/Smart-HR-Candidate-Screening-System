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
}
