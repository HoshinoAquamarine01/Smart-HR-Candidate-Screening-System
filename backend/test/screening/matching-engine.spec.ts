import { CosineSimilarityUtil } from '../../src/modules/screening/utils/cosine-similarity.util';
import { SkillTaxonomyService } from '../../src/modules/screening/services/skill-taxonomy.service';
import { MatchingEngineService } from '../../src/modules/screening/services/matching-engine.service';
import { MatchScreeningDto } from '../../src/modules/screening/dto/match-screening.dto';

describe('Matching Engine & Screening Module Test Suite (Tuần 11)', () => {
  let skillTaxonomyService: SkillTaxonomyService;
  let matchingEngineService: MatchingEngineService;

  beforeEach(() => {
    skillTaxonomyService = new SkillTaxonomyService();
    matchingEngineService = new MatchingEngineService(skillTaxonomyService);
  });

  describe('1. CosineSimilarityUtil', () => {
    it('phải tính đúng điểm 1.0 (100%) cho hai vector giống hệt nhau', () => {
      const vecA = [1, 2, 3, 4];
      const vecB = [1, 2, 3, 4];
      const cosine = CosineSimilarityUtil.calculateCosine(vecA, vecB);
      expect(cosine).toBeCloseTo(1.0, 4);
      expect(CosineSimilarityUtil.toPercentageScore(cosine)).toBe(100);
    });

    it('phải tính đúng điểm 0.0 (50%) cho hai vector trực giao (orthogonal)', () => {
      const vecA = [1, 0];
      const vecB = [0, 1];
      const cosine = CosineSimilarityUtil.calculateCosine(vecA, vecB);
      expect(cosine).toBeCloseTo(0.0, 4);
      expect(CosineSimilarityUtil.toPercentageScore(cosine)).toBe(50);
    });

    it('phải tính đúng điểm -1.0 (0%) cho hai vector ngược hướng hoàn toàn', () => {
      const vecA = [1, 2];
      const vecB = [-1, -2];
      const cosine = CosineSimilarityUtil.calculateCosine(vecA, vecB);
      expect(cosine).toBeCloseTo(-1.0, 4);
      expect(CosineSimilarityUtil.toPercentageScore(cosine)).toBe(0);
    });

    it('phải xử lý an toàn khi vector rỗng hoặc có độ dài 0', () => {
      expect(CosineSimilarityUtil.calculateCosine([], [1, 2])).toBe(0);
      expect(CosineSimilarityUtil.calculateCosine([0, 0], [1, 2])).toBe(0);
    });

    it('sinh deterministic embedding tương quan tốt giữa hai đoạn văn cùng chủ đề', () => {
      const cvText = 'Senior Backend Engineer experienced with NestJS, TypeScript, MongoDB and Docker';
      const jdText = 'Looking for Backend Developer proficient in TypeScript, Nest.js and Databases';
      const unrelatedText = 'Executive Chef with expertise in French cuisine, baking pastries and restaurant management';

      const vecCV = CosineSimilarityUtil.generateDeterministicEmbedding(cvText);
      const vecJD = CosineSimilarityUtil.generateDeterministicEmbedding(jdText);
      const vecUnrelated = CosineSimilarityUtil.generateDeterministicEmbedding(unrelatedText);

      const simRelevant = CosineSimilarityUtil.calculateCosine(vecCV, vecJD);
      const simUnrelated = CosineSimilarityUtil.calculateCosine(vecCV, vecUnrelated);

      expect(simRelevant).toBeGreaterThan(simUnrelated);
      expect(simRelevant).toBeGreaterThan(0.4);
    });
  });

  describe('2. SkillTaxonomyService & Normalization', () => {
    it('nhận diện chính xác Exact Match', () => {
      const result = skillTaxonomyService.evaluateSkillMatch(['Docker', 'React', 'Node.js'], 'Docker');
      expect(result.matchType).toBe('EXACT');
      expect(result.matchScore).toBe(1.0);
      expect(result.matchedCandidateSkill).toBe('Docker');
    });

    it('nhận diện chính xác Alias Match (từ đồng nghĩa / viết tắt)', () => {
      const result1 = skillTaxonomyService.evaluateSkillMatch(['reactjs', 'express'], 'React');
      expect(result1.matchType).toBe('ALIAS');
      expect(result1.matchScore).toBe(1.0);

      const result2 = skillTaxonomyService.evaluateSkillMatch(['k8s'], 'Kubernetes');
      expect(result2.matchType).toBe('ALIAS');
      expect(result2.matchScore).toBe(1.0);

      const result3 = skillTaxonomyService.evaluateSkillMatch(['postgres'], 'PostgreSQL');
      expect(result3.matchType).toBe('ALIAS');
      expect(result3.matchScore).toBe(1.0);
    });

    it('nhận diện Fuzzy Match bắt lỗi chính tả gõ sai (Levenshtein)', () => {
      const result = skillTaxonomyService.evaluateSkillMatch(['dockr', 'typscript'], 'Docker');
      expect(result.matchType).toBe('FUZZY');
      expect(result.matchScore).toBe(1.0);
    });

    it('nhận diện Related Skill (công nghệ họ hàng tính 0.5 điểm)', () => {
  
      const result = skillTaxonomyService.evaluateSkillMatch(['MySQL'], 'PostgreSQL');
      expect(result.matchType).toBe('RELATED');
      expect(result.matchScore).toBe(0.5);
    });

    it('trả về 0 điểm nếu hoàn toàn không có kỹ năng liên quan', () => {
      const result = skillTaxonomyService.evaluateSkillMatch(['HTML', 'CSS'], 'Kubernetes');
      expect(result.matchType).toBe('NONE');
      expect(result.matchScore).toBe(0.0);
    });
  });

  describe('3. MatchingEngineService - Logic Chấm Điểm Đa Trụ Cột', () => {
    it('tính đúng điểm Skill Score và áp dụng Hard Gate Penalty khi thiếu > 50% Required Skills', () => {
      const candidateSkills = ['TypeScript', 'Git'];
      const requiredSkills = ['NestJS', 'PostgreSQL', 'Docker', 'Redis'];
      const preferredSkills = ['Git']; 

    
      const result = matchingEngineService.calculateSkillScore(candidateSkills, requiredSkills, preferredSkills);
      expect(result.hardGateApplied).toBe(true);
      expect(result.missingRequired.length).toBe(4);
      expect(result.matchedSkills).toContain('Git');
    });

    it('tính đúng điểm Experience Score theo các mốc so sánh với yêu cầu', () => {
      
      expect(matchingEngineService.calculateExperienceScore(4, 3).score).toBe(100);
     
      expect(matchingEngineService.calculateExperienceScore(2, 4).score).toBe(50);
      
      expect(matchingEngineService.calculateExperienceScore(1, 5).score).toBe(20);
    });

    it('tính đúng điểm Education Score cho bằng cấp và chuyên ngành', () => {
      const eduCS = [{ degree: 'Kỹ sư', fieldOfStudy: 'Khoa học máy tính' }];
      expect(matchingEngineService.calculateEducationScore(eduCS, 'Bachelor', 'Computer Science').score).toBe(100);

      const eduNonCS = [{ degree: 'Cử nhân', fieldOfStudy: 'Quản trị kinh doanh' }];
      expect(matchingEngineService.calculateEducationScore(eduNonCS, 'Bachelor', 'Computer Science').score).toBe(85);
    });

    it('tính đúng Weighted Matching Score cho ứng viên Senior Backend Developer', () => {
      const dto: MatchScreeningDto = {
        targetLevel: 'SENIOR',
        requiredSkills: ['NestJS', 'TypeScript', 'MongoDB'],
        preferredSkills: ['Docker', 'Kubernetes'],
        requiredYearsOfExperience: 4,
        requiredDegree: 'Bachelor',
        candidateProfileData: {
          skills: {
            technicalSkills: ['NestJS', 'TypeScript', 'MongoDB', 'Docker'],
          },
          totalYearsOfExperience: 5,
          education: [
            {
              degree: 'Bachelor of Science',
              fieldOfStudy: 'Software Engineering',
            },
          ],
          summary: 'Experienced Senior Backend Developer with 5 years in NestJS and MongoDB',
        },
        jobDescriptionText: 'We are seeking a Senior Backend Developer proficient in NestJS, TypeScript, MongoDB and Docker.',
      };

      const result = matchingEngineService.evaluateCandidateFit(dto);
      expect(result.totalScore).toBeGreaterThanOrEqual(90);
      expect(result.breakdown.skillScore).toBeGreaterThanOrEqual(80);
      expect(result.breakdown.experienceScore).toBe(100);
      expect(result.breakdown.educationScore).toBe(100);
      expect(result.skillAnalysis.missingRequired.length).toBe(0);
      expect(result.skillAnalysis.matchedSkills).toContain('NestJS');
      expect(result.rationale).toBeDefined();
    });
  });

  describe('4. Evaluation Metrics (Precision@K, Recall@K, NDCG@K)', () => {
    it('tính toán chính xác chỉ số Precision@K, Recall@K và NDCG@K trên bảng xếp hạng', () => {
      const predictedRanking = [
        { candidateId: 'c1', score: 95 },
        { candidateId: 'c2', score: 88 },
        { candidateId: 'c3', score: 75 },
        { candidateId: 'c4', score: 60 },
        { candidateId: 'c5', score: 40 },
      ];

    
      const groundTruthRelevance: Record<string, number> = {
        c1: 3,
        c2: 2,
        c3: 1,
        c4: 0,
        c5: 0,
      };

      const metrics = matchingEngineService.evaluateRankingMetrics(predictedRanking, groundTruthRelevance, 3);
      
     
      expect(metrics.precisionAtK).toBeCloseTo(0.667, 2);
     
      expect(metrics.recallAtK).toBe(1.0);
     
      expect(metrics.ndcgAtK).toBe(1.0);
    });
  });
});

