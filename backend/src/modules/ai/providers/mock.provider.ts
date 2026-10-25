import { Injectable, Logger } from '@nestjs/common';
import { StandardCvProfile } from '../interfaces/standard-cv.interface';
import { AiExtractionResult, IAiProvider } from '../interfaces/ai-provider.interface';

@Injectable()
export class MockAiProvider implements IAiProvider {
  readonly name = 'Mock LLM Provider';
  private readonly logger = new Logger(MockAiProvider.name);

  isAvailable(): boolean {
    return true;
  }

  async extractCv(cleanedText: string): Promise<AiExtractionResult> {
    this.logger.log('Executing MockAiProvider for CV extraction (fallback/offline mode)');

    // Smart heuristic extraction from text for realistic mock profile
    const emailMatch = cleanedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = cleanedText.match(/(\+84|0)[1-9][0-9]{8,9}/);

    // Try finding candidate name from first non-empty lines
    const lines = cleanedText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    let extractedName = 'Nguyễn Văn A';
    if (lines.length > 0) {
      const candidateLine = lines[0].replace(/^(cv|curriculum vitae|resume)\s*[:-]?\s*/i, '').trim();
      if (candidateLine && candidateLine.length < 50 && !candidateLine.includes('@')) {
        extractedName = candidateLine;
      }
    }

    // Detect skills
    const techSkillsKeywords = [
      'Node.js',
      'NestJS',
      'TypeScript',
      'JavaScript',
      'React',
      'Vue',
      'Angular',
      'Python',
      'Java',
      'Golang',
      'Docker',
      'Kubernetes',
      'MongoDB',
      'PostgreSQL',
      'MySQL',
      'Redis',
      'AWS',
      'Git',
    ];
    const foundTechSkills = techSkillsKeywords.filter((kw) =>
      new RegExp(`\\b${kw}\\b`, 'i').test(cleanedText),
    );

    const profile: StandardCvProfile = {
      personalInfo: {
        fullName: extractedName,
        email: emailMatch ? emailMatch[0] : 'candidate@example.com',
        phone: phoneMatch ? phoneMatch[0] : '0987654321',
        location: 'Hà Nội, Việt Nam',
        linkedin: 'https://linkedin.com/in/candidate',
        github: 'https://github.com/candidate',
        portfolioUrl: null,
        currentTitle: 'Software Engineer',
      },
      summary:
        cleanedText.length > 50
          ? cleanedText.slice(0, 300).replace(/\s+/g, ' ') + '...'
          : 'Lập trình viên nhiệt huyết với kinh nghiệm phát triển các hệ thống phần mềm hiệu năng cao.',
      yearsOfExperience: 3,
      skills: {
        technicalSkills: foundTechSkills.length > 0 ? foundTechSkills : ['TypeScript', 'Node.js', 'MongoDB', 'React'],
        softSkills: ['Kỹ năng giao tiếp', 'Làm việc nhóm', 'Giải quyết vấn đề'],
        toolsAndPlatforms: ['Git', 'Docker', 'Postman', 'VS Code'],
      },
      workExperience: [
        {
          company: 'Tech Solutions Corp',
          role: 'Fullstack Developer',
          location: 'Hà Nội',
          startDate: '2022-01',
          endDate: 'Present',
          isCurrent: true,
          durationMonths: 24,
          description: 'Tham gia thiết kế và xây dựng các module backend NestJS và frontend React.',
          responsibilities: [
            'Phát triển RESTful APIs và tối ưu hóa truy vấn MongoDB',
            'Tích hợp xác thực JWT và kiểm thử tự động',
          ],
          achievements: ['Cải thiện tốc độ phản hồi API 35%'],
          techStack: ['NestJS', 'TypeScript', 'MongoDB', 'Docker'],
        },
      ],
      education: [
        {
          institution: 'Đại học Bách Khoa',
          degree: 'Kỹ sư',
          fieldOfStudy: 'Công nghệ Thông tin',
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
          proficiency: 'Professional / TOEIC 750',
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
}
