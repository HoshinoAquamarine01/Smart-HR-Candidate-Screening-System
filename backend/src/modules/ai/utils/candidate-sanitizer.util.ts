   import { StandardCvProfile, StandardSkills, StandardWorkExperience } from '../interfaces/standard-cv.interface';


export const TECH_SYNONYM_DICTIONARY: Record<string, string> = {
  
  reactjs: 'React',
  'react.js': 'React',
  react: 'React',
  nextjs: 'Next.js',
  'next.js': 'Next.js',
  vuejs: 'Vue.js',
  'vue.js': 'Vue.js',
  'vue 3': 'Vue.js',
  vue: 'Vue.js',
  angularjs: 'AngularJS',
  angular: 'Angular',
  nuxtjs: 'Nuxt.js',
  'nuxt.js': 'Nuxt.js',
  svelte: 'Svelte',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  javascript: 'JavaScript',
  js: 'JavaScript',
  html5: 'HTML5',
  html: 'HTML',
  css3: 'CSS3',
  css: 'CSS',
  tailwind: 'Tailwind CSS',
  tailwindcss: 'Tailwind CSS',
  bootstrap: 'Bootstrap',
  sass: 'Sass',
  scss: 'Sass',


  nodejs: 'Node.js',
  'node.js': 'Node.js',
  node: 'Node.js',
  nestjs: 'NestJS',
  'nest.js': 'NestJS',
  nest: 'NestJS',
  expressjs: 'Express',
  'express.js': 'Express',
  express: 'Express',
  golang: 'Go',
  'go lang': 'Go',
  go: 'Go',
  python: 'Python',
  py: 'Python',
  'c#': 'C#',
  'c sharp': 'C#',
  csharp: 'C#',
  'c++': 'C++',
  cpp: 'C++',
  java: 'Java',
  kotlin: 'Kotlin',
  swift: 'Swift',
  rust: 'Rust',
  php: 'PHP',
  laravel: 'Laravel',
  django: 'Django',
  fastapi: 'FastAPI',
  flask: 'Flask',
  'spring boot': 'Spring Boot',
  springboot: 'Spring Boot',
  'spring framework': 'Spring Boot',
  dotnet: '.NET',
  '.net': '.NET',
  '.net core': '.NET Core',
  aspnet: 'ASP.NET',


  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  psql: 'PostgreSQL',
  mongo: 'MongoDB',
  mongodb: 'MongoDB',
  mysql: 'MySQL',
  mariadb: 'MariaDB',
  redis: 'Redis',
  elasticsearch: 'Elasticsearch',
  elastic: 'Elasticsearch',
  sqlite: 'SQLite',
  cassandra: 'Cassandra',
  neo4j: 'Neo4j',
  dynamodb: 'DynamoDB',

  
  'amazon web services': 'AWS',
  aws: 'AWS',
  'google cloud': 'GCP',
  'google cloud platform': 'GCP',
  gcp: 'GCP',
  azure: 'Microsoft Azure',
  docker: 'Docker',
  k8s: 'Kubernetes',
  kubernetes: 'Kubernetes',
  terraform: 'Terraform',
  ansible: 'Ansible',
  jenkins: 'Jenkins',
  githubactions: 'GitHub Actions',
  'github actions': 'GitHub Actions',
  gitlabci: 'GitLab CI/CD',
  'gitlab ci': 'GitLab CI/CD',

  kafka: 'Apache Kafka',
  rabbitmq: 'RabbitMQ',
  microservices: 'Microservices',
  graphql: 'GraphQL',
  grpc: 'gRPC',
  restful: 'RESTful API',
  'rest api': 'RESTful API',
  rest: 'RESTful API',


  git: 'Git',
  postman: 'Postman',
  jira: 'Jira',
  figma: 'Figma',
  jest: 'Jest',
  cypress: 'Cypress',
  selenium: 'Selenium',
};

export class CandidateSanitizerUtil {

  static sanitizeRawCvText(rawText: string): string {
    if (!rawText) return '';

    return (
      rawText
      
        .replace(/\r\n/g, '\n')
      
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\u00A0/g, ' ')
      
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
       
        .replace(/([a-zA-ZÀ-ỹ]{2,})-\s*\n\s*([a-zA-ZÀ-ỹ]{2,})/g, '$1$2')
        
        .replace(/\b(?:Page|Trang)\s*\d+\s*(?:of|\/)\s*\d+\b/gi, '')
        .replace(/\b(?:Created with|Powered by|Mẫu CV tạo bởi)\s+(?:TopCV|Canva|VietnamWorks|CakeResume)\b/gi, '')
       
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    );
  }

  static mergeWorkIntervals(
    experiences: { startDate?: string | null; endDate?: string | null; isCurrent?: boolean }[],
  ): number {
    if (!experiences || experiences.length === 0) return 0;

    const intervals: { start: number; end: number }[] = [];
    const now = new Date();

    for (const exp of experiences) {
      if (!exp.startDate) continue;

      const parseDate = (dStr: string): number => {
        const clean = dStr.trim();
      
        if (/^\d{4}-\d{1,2}$/.test(clean)) {
          const [year, month] = clean.split('-').map(Number);
          return new Date(year, month - 1, 1).getTime();
        }
        
        if (/^\d{1,2}[\/-]\d{4}$/.test(clean)) {
          const parts = clean.split(/[\/-]/).map(Number);
          return new Date(parts[1], parts[0] - 1, 1).getTime();
        }
      
        if (/^\d{4}$/.test(clean)) {
          return new Date(Number(clean), 0, 1).getTime();
        }
        const parsed = new Date(clean).getTime();
        return isNaN(parsed) ? NaN : parsed;
      };

      const start = parseDate(exp.startDate);
      const isEndCurrent =
        exp.isCurrent ||
        !exp.endDate ||
        /^(present|nay|hiện tại|current)$/i.test(exp.endDate.trim());

      const end = isEndCurrent ? now.getTime() : parseDate(exp.endDate!);

      if (!isNaN(start) && !isNaN(end) && end >= start) {
        intervals.push({ start, end });
      }
    }

    if (intervals.length === 0) return 0;

   
    intervals.sort((a, b) => a.start - b.start);

   
    const merged: { start: number; end: number }[] = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
      const prev = merged[merged.length - 1];
      const curr = intervals[i];

      if (curr.start <= prev.end) {
        prev.end = Math.max(prev.end, curr.end);
      } else {
        merged.push(curr);
      }
    }

    const totalMs = merged.reduce((sum, item) => sum + (item.end - item.start), 0);
    const years = totalMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.round(years * 10) / 10;
  }

  
  static normalizeSkillName(skill: string): string {
    if (!skill) return '';
    const trimmed = skill.trim().replace(/^[-•*#\s]+/, '').replace(/[,.;]+$/, '');
    const lowerKey = trimmed.toLowerCase();

    if (TECH_SYNONYM_DICTIONARY[lowerKey]) {
      return TECH_SYNONYM_DICTIONARY[lowerKey];
    }

    return trimmed;
  }

  
  static sanitizeSkills(skills: StandardSkills): StandardSkills {
    const normalizeList = (list: string[]): string[] => {
      if (!Array.isArray(list)) return [];
      const seen = new Set<string>();
      const result: string[] = [];

      for (const item of list) {
        if (!item) continue;
        const normalized = this.normalizeSkillName(item);
        if (!normalized || normalized.length < 2) continue;
        const lower = normalized.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          result.push(normalized);
        }
      }
      return result;
    };

    const tech = normalizeList(skills?.technicalSkills || []);
    const soft = normalizeList(skills?.softSkills || []);
    let tools = normalizeList(skills?.toolsAndPlatforms || []);

 
    const techSet = new Set(tech.map((s) => s.toLowerCase()));
    tools = tools.filter((t) => !techSet.has(t.toLowerCase()));

    return {
      technicalSkills: tech,
      softSkills: soft,
      toolsAndPlatforms: tools,
    };
  }


  static sanitizePhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    let clean = phone.replace(/[\s\.\-\(\)]/g, '');

  
    if (clean.startsWith('+84')) {
      clean = '0' + clean.slice(3);
    } else if (clean.startsWith('84') && clean.length >= 11) {
      clean = '0' + clean.slice(2);
    }

   
    if (/^0[35789]\d{8}$/.test(clean) || /^0\d{9,10}$/.test(clean)) {
      return clean;
    }

    return phone.trim();
  }

  
  static sanitizeEmail(email: string | null | undefined): string | null {
    if (!email) return null;
    const clean = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailRegex.test(clean)) {
      return clean;
    }
    return null;
  }

 
  static sanitizeFullName(name: string | null | undefined): string {
    if (!name) return 'Unknown Candidate';
    let clean = name.trim();

  
    clean = clean.replace(/^(cv|curriculum vitae|resume|hồ sơ xin việc)\s*[:-]?\s*/i, '');
    clean = clean.replace(/^(họ và tên|họ tên|full name|name)\s*[:-]?\s*/i, '');

    const invalidPatterns = [
      /^(senior|junior|lead|principal|staff)?\s*(software|backend|frontend|fullstack|devops|qa|qc|mobile|data)\s*(engineer|developer|architect)$/i,
      /^(project manager|product manager|scrum master|tech lead|hr manager|intern)$/i,
      /^(lập trình viên|kỹ sư|nhân viên|thực tập sinh)/i,
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(clean)) {
        return 'Unknown Candidate';
      }
    }

 
    if (clean.length > 0 && clean.length <= 60) {
      return clean;
    }

    return clean || 'Unknown Candidate';
  }

 
  static calculateDynamicConfidenceScore(profile: StandardCvProfile): number {
    let score = 50;

    const name = profile?.personalInfo?.fullName?.trim() || '';
    const nameWords = name.split(/\s+/).filter(Boolean);
    if (name && nameWords.length >= 2 && !name.toLowerCase().includes('unknown')) {
      score += 15;
    } else if (name && nameWords.length >= 1) {
      score += 8;
    }

    const hasEmail = !!this.sanitizeEmail(profile?.personalInfo?.email);
    const hasPhone = !!this.sanitizePhone(profile?.personalInfo?.phone);
    if (hasEmail && hasPhone) {
      score += 15;
    } else if (hasEmail || hasPhone) {
      score += 8;
    }

  
    if (Array.isArray(profile?.workExperience) && profile.workExperience.length > 0) {
      const validExp = profile.workExperience.some(
        (exp) => exp.company && exp.role && (exp.startDate || exp.isCurrent),
      );
      if (validExp) {
        score += 10;
      } else {
        score += 5;
      }
    }

   
    if (
      Array.isArray(profile?.skills?.technicalSkills) &&
      profile.skills.technicalSkills.length >= 3
    ) {
      score += 5;
    } else if (profile?.skills?.technicalSkills?.length > 0) {
      score += 3;
    }

   
    if (
      Array.isArray(profile?.education) &&
      profile.education.length > 0 &&
      profile.education.some((e) => e.institution && e.degree)
    ) {
      score += 5;
    }

    return Math.min(100, Math.max(50, score));
  }

  static sanitizeCandidateProfile(profile: StandardCvProfile): StandardCvProfile {
    if (!profile) return profile;

    if (profile.personalInfo) {
      profile.personalInfo.fullName = this.sanitizeFullName(profile.personalInfo.fullName);
      profile.personalInfo.email = this.sanitizeEmail(profile.personalInfo.email);
      profile.personalInfo.phone = this.sanitizePhone(profile.personalInfo.phone);
    }

    if (profile.skills) {
      profile.skills = this.sanitizeSkills(profile.skills);
    }

    if (Array.isArray(profile.workExperience) && profile.workExperience.length > 0) {
      const calculatedYears = this.mergeWorkIntervals(profile.workExperience);
    
      if (
        profile.yearsOfExperience === undefined ||
        profile.yearsOfExperience === null ||
        isNaN(profile.yearsOfExperience) ||
        Math.abs(profile.yearsOfExperience - calculatedYears) > 0.5
      ) {
        profile.yearsOfExperience = calculatedYears;
      }
    } else if (!profile.yearsOfExperience) {
      profile.yearsOfExperience = 0;
    }

    return profile;
  }
}
