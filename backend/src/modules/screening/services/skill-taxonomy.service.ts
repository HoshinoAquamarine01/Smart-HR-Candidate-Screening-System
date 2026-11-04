import { Injectable, Logger } from '@nestjs/common';
import { CosineSimilarityUtil } from '../utils/cosine-similarity.util';

export interface SkillEntry {
  standardName: string;
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'cloud' | 'mobile' | 'ai_data' | 'general';
  aliases: string[];
  relatedSkills: string[];
}

export interface SkillMatchResult {
  requiredSkill: string;
  matchedCandidateSkill: string | null;
  matchScore: number;
  matchType: 'EXACT' | 'ALIAS' | 'FUZZY' | 'SEMANTIC' | 'RELATED' | 'NONE';
  rationale: string;
  similarity?: number;
}

@Injectable()
export class SkillTaxonomyService {
  private readonly logger = new Logger(SkillTaxonomyService.name);


  private readonly taxonomy: SkillEntry[] = [

    {
      standardName: 'React',
      category: 'frontend',
      aliases: ['reactjs', 'react.js', 'react js', 'react-js'],
      relatedSkills: ['Next.js', 'Vue.js', 'Redux', 'React Native'],
    },
    {
      standardName: 'Next.js',
      category: 'frontend',
      aliases: ['nextjs', 'next.js', 'next js'],
      relatedSkills: ['React', 'SSR', 'Vercel'],
    },
    {
      standardName: 'Vue.js',
      category: 'frontend',
      aliases: ['vue', 'vuejs', 'vue.js', 'vue 3', 'vue 2'],
      relatedSkills: ['Nuxt.js', 'React', 'Pinia', 'Vuex'],
    },
    {
      standardName: 'Angular',
      category: 'frontend',
      aliases: ['angularjs', 'angular.io', 'angular 2+'],
      relatedSkills: ['TypeScript', 'RxJS', 'NgRx'],
    },
    {
      standardName: 'TypeScript',
      category: 'frontend',
      aliases: ['ts', 'typescript', 'type-script'],
      relatedSkills: ['JavaScript', 'Node.js'],
    },
    {
      standardName: 'JavaScript',
      category: 'frontend',
      aliases: ['js', 'javascript', 'es6', 'ecmascript'],
      relatedSkills: ['TypeScript', 'HTML5', 'CSS3'],
    },
    {
      standardName: 'Tailwind CSS',
      category: 'frontend',
      aliases: ['tailwind', 'tailwindcss', 'tailwind-css'],
      relatedSkills: ['CSS3', 'Bootstrap', 'Sass'],
    },

 
    {
      standardName: 'NestJS',
      category: 'backend',
      aliases: ['nest.js', 'nestjs', 'nest js', 'nest'],
      relatedSkills: ['Node.js', 'Express', 'TypeScript', 'TypeORM', 'Prisma'],
    },
    {
      standardName: 'Node.js',
      category: 'backend',
      aliases: ['nodejs', 'node.js', 'node js', 'node'],
      relatedSkills: ['NestJS', 'Express', 'JavaScript', 'TypeScript'],
    },
    {
      standardName: 'Express',
      category: 'backend',
      aliases: ['expressjs', 'express.js', 'express js'],
      relatedSkills: ['Node.js', 'NestJS', 'Fastify'],
    },
    {
      standardName: 'Python',
      category: 'backend',
      aliases: ['py', 'python', 'python3'],
      relatedSkills: ['Django', 'FastAPI', 'Flask', 'Pandas', 'PyTorch'],
    },
    {
      standardName: 'FastAPI',
      category: 'backend',
      aliases: ['fast-api', 'fastapi'],
      relatedSkills: ['Python', 'Pydantic', 'AsyncIO'],
    },
    {
      standardName: 'Django',
      category: 'backend',
      aliases: ['django', 'django-rest-framework', 'drf'],
      relatedSkills: ['Python', 'FastAPI', 'PostgreSQL'],
    },
    {
      standardName: 'Java',
      category: 'backend',
      aliases: ['java', 'jvm', 'java 8', 'java 11', 'java 17', 'java 21'],
      relatedSkills: ['Spring Boot', 'Hibernate', 'Kotlin'],
    },
    {
      standardName: 'Spring Boot',
      category: 'backend',
      aliases: ['spring', 'springboot', 'spring-boot', 'spring framework'],
      relatedSkills: ['Java', 'Hibernate', 'Microservices'],
    },
    {
      standardName: 'Go',
      category: 'backend',
      aliases: ['golang', 'go-lang', 'go language'],
      relatedSkills: ['Microservices', 'gRPC', 'Docker', 'Kubernetes'],
    },
    {
      standardName: 'C# / .NET',
      category: 'backend',
      aliases: ['c#', 'csharp', '.net', '.net core', 'asp.net', 'dotnet'],
      relatedSkills: ['Entity Framework', 'Azure', 'SQL Server'],
    },

   
    {
      standardName: 'PostgreSQL',
      category: 'database',
      aliases: ['postgres', 'postgresql', 'psql'],
      relatedSkills: ['MySQL', 'SQL Server', 'Database Design', 'TypeORM', 'Prisma'],
    },
    {
      standardName: 'MySQL',
      category: 'database',
      aliases: ['mysql', 'my-sql', 'mariadb'],
      relatedSkills: ['PostgreSQL', 'SQL', 'Database Design'],
    },
    {
      standardName: 'MongoDB',
      category: 'database',
      aliases: ['mongo', 'mongodb', 'mongoose'],
      relatedSkills: ['NoSQL', 'DocumentDB', 'Redis'],
    },
    {
      standardName: 'Redis',
      category: 'database',
      aliases: ['redis', 'redis-cache', 'valkey'],
      relatedSkills: ['Caching', 'In-memory DB', 'Message Queue'],
    },

    
    {
      standardName: 'Docker',
      category: 'devops',
      aliases: ['docker', 'container', 'containers', 'docker-compose'],
      relatedSkills: ['Kubernetes', 'CI/CD', 'Podman'],
    },
    {
      standardName: 'Kubernetes',
      category: 'devops',
      aliases: ['k8s', 'kubernetes', 'kube'],
      relatedSkills: ['Docker', 'Helm', 'DevOps', 'Cloud Architecture'],
    },
    {
      standardName: 'AWS',
      category: 'cloud',
      aliases: ['amazon web services', 'aws', 'amazon cloud'],
      relatedSkills: ['GCP', 'Azure', 'CloudFormation', 'Terraform', 'Lambda', 'S3'],
    },
    {
      standardName: 'GCP',
      category: 'cloud',
      aliases: ['google cloud platform', 'gcp', 'google cloud'],
      relatedSkills: ['AWS', 'Azure', 'Cloud Run', 'BigQuery'],
    },
    {
      standardName: 'CI/CD',
      category: 'devops',
      aliases: ['ci-cd', 'ci/cd', 'github actions', 'gitlab ci', 'jenkins'],
      relatedSkills: ['Docker', 'DevOps', 'Automation Testing'],
    },
    {
      standardName: 'Git',
      category: 'general',
      aliases: ['git', 'github', 'gitlab', 'version control', 'bitbucket'],
      relatedSkills: ['CI/CD', 'Code Review'],
    },
    {
      standardName: 'RabbitMQ',
      category: 'backend',
      aliases: ['rabbitmq', 'message queue', 'amqp'],
      relatedSkills: ['Kafka', 'BullMQ', 'Event-Driven Architecture'],
    },
    {
      standardName: 'Kafka',
      category: 'backend',
      aliases: ['apache kafka', 'kafka'],
      relatedSkills: ['RabbitMQ', 'Event Streaming', 'Microservices'],
    },
    {
      standardName: 'GraphQL',
      category: 'backend',
      aliases: ['graphql', 'apollo-server', 'apollo'],
      relatedSkills: ['REST API', 'gRPC', 'API Design'],
    },
    {
      standardName: 'REST API',
      category: 'backend',
      aliases: ['rest', 'restful', 'rest api', 'restful api', 'api integration'],
      relatedSkills: ['GraphQL', 'Swagger', 'OpenAPI'],
    },
  ];

  
  normalizeSkillName(rawName: string): string {
    if (!rawName) return '';
    return rawName
      .toLowerCase()
      .trim()
      .replace(/[\.\-\_\/]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  
  private levenshteinDistance(a: string, b: string): number {
    const an = a.length;
    const bn = b.length;
    if (an === 0) return bn;
    if (bn === 0) return an;

    const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
    for (let j = 0; j <= an; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= bn; i++) {
      for (let j = 1; j <= an; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, 
            matrix[i][j - 1] + 1,     
            matrix[i - 1][j] + 1,     
          );
        }
      }
    }
    return matrix[bn][an];
  }

 
  calculateStringSimilarity(s1: string, s2: string): number {
    const norm1 = this.normalizeSkillName(s1);
    const norm2 = this.normalizeSkillName(s2);
    if (norm1 === norm2) return 1.0;
    if (norm1.length === 0 || norm2.length === 0) return 0.0;

    const maxLen = Math.max(norm1.length, norm2.length);
    const dist = this.levenshteinDistance(norm1, norm2);
    return (maxLen - dist) / maxLen;
  }

  
  findTaxonomyEntry(skillName: string): SkillEntry | null {
    const norm = this.normalizeSkillName(skillName);
    if (!norm) return null;

    for (const entry of this.taxonomy) {
      if (this.normalizeSkillName(entry.standardName) === norm) {
        return entry;
      }
      for (const alias of entry.aliases) {
        if (this.normalizeSkillName(alias) === norm) {
          return entry;
        }
      }
    }
    return null;
  }


  evaluateSkillMatch(
    candidateSkills: string[],
    requiredSkill: string,
    vectorMap?: Map<string, number[]>,
  ): SkillMatchResult {
    if (!candidateSkills || candidateSkills.length === 0 || !requiredSkill) {
      return {
        requiredSkill,
        matchedCandidateSkill: null,
        matchScore: 0,
        matchType: 'NONE',
        rationale: `Chưa tìm thấy thông tin kỹ năng "${requiredSkill}" trong hồ sơ ứng viên.`,
      };
    }

    const normReq = this.normalizeSkillName(requiredSkill);
    const reqEntry = this.findTaxonomyEntry(requiredSkill);

    
    for (const candSkill of candidateSkills) {
      const normCand = this.normalizeSkillName(candSkill);
      if (normReq === normCand) {
        return {
          requiredSkill,
          matchedCandidateSkill: candSkill,
          matchScore: 1.0,
          matchType: 'EXACT',
          rationale: `Khớp hoàn toàn: "${candSkill}" khớp trực tiếp với yêu cầu "${requiredSkill}".`,
        };
      }

      if (reqEntry) {
        const isAlias = reqEntry.aliases.some(
          alias => this.normalizeSkillName(alias) === normCand,
        );
        if (isAlias || this.normalizeSkillName(reqEntry.standardName) === normCand) {
          return {
            requiredSkill,
            matchedCandidateSkill: candSkill,
            matchScore: 1.0,
            matchType: 'ALIAS',
            rationale: `Khớp tên định danh tương đương: "${candSkill}" là từ đồng nghĩa/chuẩn của "${requiredSkill}".`,
          };
        }
      }
    }

   
    for (const candSkill of candidateSkills) {
      let sim = this.calculateStringSimilarity(candSkill, requiredSkill);
      if (reqEntry) {
        sim = Math.max(
          sim,
          this.calculateStringSimilarity(candSkill, reqEntry.standardName),
          ...reqEntry.aliases.map(a => this.calculateStringSimilarity(candSkill, a)),
        );
      }

      if (sim >= 0.80) {
        return {
          requiredSkill,
          matchedCandidateSkill: candSkill,
          matchScore: 1.0,
          matchType: 'FUZZY',
          rationale: `Khớp xấp xỉ (chênh lệch gõ chữ nhẹ, độ khớp ${Math.round(sim * 100)}%): "${candSkill}" ≈ "${requiredSkill}".`,
        };
      }
    }

   
    if (reqEntry && reqEntry.relatedSkills && reqEntry.relatedSkills.length > 0) {
      for (const candSkill of candidateSkills) {
        const candEntry = this.findTaxonomyEntry(candSkill);
        const candStandard = candEntry ? candEntry.standardName : candSkill;

        const isRelated = reqEntry.relatedSkills.some(rel => {
          return (
            this.normalizeSkillName(rel) === this.normalizeSkillName(candStandard) ||
            this.calculateStringSimilarity(rel, candStandard) >= 0.88
          );
        });

        if (isRelated) {
          return {
            requiredSkill,
            matchedCandidateSkill: candSkill,
            matchScore: 0.5,
            matchType: 'RELATED',
            rationale: `Đáp ứng một phần: Ứng viên có kỹ năng họ hàng "${candSkill}" tương quan tốt với "${requiredSkill}".`,
          };
        }
      }
    }

  
    // 4. Kiểm tra Vector Semantic Matching cho kỹ năng mới / ngoài từ điển ([FR-AI-04a])
    if (vectorMap && vectorMap.has(requiredSkill)) {
      const reqVec = vectorMap.get(requiredSkill)!;
      let highestSim = -1;
      let bestCandSkill: string | null = null;

      for (const candSkill of candidateSkills) {
        const candVec = vectorMap.get(candSkill);
        if (candVec && candVec.length > 0) {
          const sim = CosineSimilarityUtil.calculateCosine(reqVec, candVec);
          if (sim > highestSim) {
            highestSim = sim;
            bestCandSkill = candSkill;
          }
        }
      }

      // Phân cấp chuẩn theo [FR-AI-04a]
      if (highestSim >= 0.90 && bestCandSkill) {
        return {
          requiredSkill,
          matchedCandidateSkill: bestCandSkill,
          matchScore: 1.0,
          matchType: 'SEMANTIC',
          similarity: Math.round(highestSim * 100) / 100,
          rationale: `Khớp ngữ nghĩa xuất sắc (Cosine ${Math.round(highestSim * 100)}%): "${bestCandSkill}" tương đương "${requiredSkill}".`,
        };
      } else if (highestSim >= 0.75 && bestCandSkill) {
        return {
          requiredSkill,
          matchedCandidateSkill: bestCandSkill,
          matchScore: 0.8,
          matchType: 'SEMANTIC',
          similarity: Math.round(highestSim * 100) / 100,
          rationale: `Khớp ngữ nghĩa cao (Cosine ${Math.round(highestSim * 100)}%): "${bestCandSkill}" tương quan mạnh với "${requiredSkill}".`,
        };
      } else if (highestSim >= 0.50 && bestCandSkill) {
        return {
          requiredSkill,
          matchedCandidateSkill: bestCandSkill,
          matchScore: 0.5,
          matchType: 'RELATED',
          similarity: Math.round(highestSim * 100) / 100,
          rationale: `Khớp một phần qua ngữ nghĩa (Cosine ${Math.round(highestSim * 100)}%): "${bestCandSkill}" có liên quan đến "${requiredSkill}".`,
        };
      }
    }

    return {
      requiredSkill,
      matchedCandidateSkill: null,
      matchScore: 0.0,
      matchType: 'NONE',
      rationale: `Chưa tìm thấy bằng chứng đáp ứng kỹ năng "${requiredSkill}" trong CV.`,
    };
  }

  /**
   * Phương thức bất đồng bộ tự động sinh vector embedding và đối chiếu kỹ năng
   */
  async evaluateSkillMatchAsync(
    candidateSkills: string[],
    requiredSkill: string,
    vectorResolver?: (text: string) => Promise<number[]>,
  ): Promise<SkillMatchResult> {
    const directMatch = this.evaluateSkillMatch(candidateSkills, requiredSkill);
    if (directMatch.matchType !== 'NONE') {
      return directMatch;
    }

    const vectorMap = new Map<string, number[]>();
    if (vectorResolver) {
      try {
        const reqVec = await vectorResolver(requiredSkill);
        vectorMap.set(requiredSkill, reqVec);

        for (const candSkill of candidateSkills) {
          const candVec = await vectorResolver(candSkill);
          vectorMap.set(candSkill, candVec);
        }

        return this.evaluateSkillMatch(candidateSkills, requiredSkill, vectorMap);
      } catch (err: any) {
        this.logger.warn(`Vector resolution failed during skill match: ${err.message}`);
      }
    }

    return directMatch;
  }
}
