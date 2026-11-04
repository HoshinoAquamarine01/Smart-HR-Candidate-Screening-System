import { Injectable, Logger } from '@nestjs/common';
import { SkillTaxonomyService, SkillMatchResult } from './skill-taxonomy.service';
import { CosineSimilarityUtil } from '../utils/cosine-similarity.util';
import {
  MatchScreeningDto,
  ScoringWeightsDto,
} from '../dto/match-screening.dto';
import {
  MatchingResultDto,
  AppliedScoringWeights,
  SkillBreakdownDetail,
} from '../dto/screening-result.dto';

@Injectable()
export class MatchingEngineService {
  private readonly logger = new Logger(MatchingEngineService.name);

  constructor(private readonly skillTaxonomyService: SkillTaxonomyService) {}


  resolveWeights(
    level?: string,
    customWeights?: ScoringWeightsDto,
  ): AppliedScoringWeights {
    if (customWeights) {
      const sem = customWeights.semantic ?? 0.25;
      const skl = customWeights.skill ?? 0.45;
      const exp = customWeights.experience ?? 0.25;
      const edu = customWeights.education ?? 0.05;
      const sum = sem + skl + exp + edu;
      if (sum > 0) {
        return {
          semantic: Math.round((sem / sum) * 100) / 100,
          skill: Math.round((skl / sum) * 100) / 100,
          experience: Math.round((exp / sum) * 100) / 100,
          education: Math.round((edu / sum) * 100) / 100,
        };
      }
    }

    const lvl = (level || '').toUpperCase();
    if (lvl === 'INTERN' || lvl === 'FRESHER') {
      return { semantic: 0.25, skill: 0.45, experience: 0.05, education: 0.25 };
    }
    if (lvl === 'SENIOR' || lvl === 'LEAD') {
      return { semantic: 0.20, skill: 0.35, experience: 0.40, education: 0.05 };
    }
 
    return { semantic: 0.25, skill: 0.45, experience: 0.25, education: 0.05 };
  }


  calculateSemanticScore(
    cvText: string,
    jdText: string,
    cvVector?: number[],
    jdVector?: number[],
  ): number {
    let vecA = cvVector;
    let vecB = jdVector;

    if (!vecA || vecA.length === 0) {
      vecA = CosineSimilarityUtil.generateDeterministicEmbedding(cvText || '', 128);
    }
    if (!vecB || vecB.length === 0) {
      vecB = CosineSimilarityUtil.generateDeterministicEmbedding(jdText || '', 128);
    }

    const cosine = CosineSimilarityUtil.calculateCosine(vecA, vecB);
    return CosineSimilarityUtil.toPercentageScore(cosine);
  }

  
  calculateSkillScore(
    candidateSkills: string[],
    requiredSkills: string[] = [],
    preferredSkills: string[] = [],
    vectorMap?: Map<string, number[]>,
  ): {
    score: number;
    details: SkillBreakdownDetail[];
    matchedSkills: string[];
    partialSkills: string[];
    missingRequired: string[];
    missingPreferred: string[];
    hardGateApplied: boolean;
  } {
    const details: SkillBreakdownDetail[] = [];
    const matchedSkills: string[] = [];
    const partialSkills: string[] = [];
    const missingRequired: string[] = [];
    const missingPreferred: string[] = [];

    let totalWeight = 0;
    let weightedEarned = 0;

    const WEIGHT_REQUIRED = 3.0;
    const WEIGHT_PREFERRED = 1.0;


    for (const reqSkill of requiredSkills) {
      const match = this.skillTaxonomyService.evaluateSkillMatch(candidateSkills, reqSkill, vectorMap);
      totalWeight += WEIGHT_REQUIRED;
      weightedEarned += match.matchScore * WEIGHT_REQUIRED;

      details.push({
        skill: reqSkill,
        category: 'REQUIRED',
        matchedWith: match.matchedCandidateSkill,
        matchScore: match.matchScore,
        matchType: match.matchType,
        rationale: match.rationale,
      });

      if (match.matchScore === 1.0) {
        matchedSkills.push(reqSkill);
      } else if (match.matchScore > 0) {
        partialSkills.push(`${reqSkill} (qua ${match.matchedCandidateSkill})`);
      } else {
        missingRequired.push(reqSkill);
      }
    }


    for (const prefSkill of preferredSkills) {
      const match = this.skillTaxonomyService.evaluateSkillMatch(candidateSkills, prefSkill, vectorMap);
      totalWeight += WEIGHT_PREFERRED;
      weightedEarned += match.matchScore * WEIGHT_PREFERRED;

      details.push({
        skill: prefSkill,
        category: 'PREFERRED',
        matchedWith: match.matchedCandidateSkill,
        matchScore: match.matchScore,
        matchType: match.matchType,
        rationale: match.rationale,
      });

      if (match.matchScore === 1.0) {
        matchedSkills.push(prefSkill);
      } else if (match.matchScore > 0) {
        partialSkills.push(`${prefSkill} (qua ${match.matchedCandidateSkill})`);
      } else {
        missingPreferred.push(prefSkill);
      }
    }

    if (totalWeight === 0) {
   
      return {
        score: 100,
        details,
        matchedSkills,
        partialSkills,
        missingRequired,
        missingPreferred,
        hardGateApplied: false,
      };
    }

    let rawSkillScore = (weightedEarned / totalWeight) * 100;

   
    let hardGateApplied = false;
    if (requiredSkills.length > 0 && missingRequired.length / requiredSkills.length > 0.5) {
      rawSkillScore = rawSkillScore * 0.8;
      hardGateApplied = true;
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(rawSkillScore * 10) / 10));

    return {
      score: finalScore,
      details,
      matchedSkills,
      partialSkills,
      missingRequired,
      missingPreferred,
      hardGateApplied,
    };
  }


  calculateExperienceScore(
    candYears: number,
    reqYears: number = 0,
  ): { score: number; evaluation: string; ratioPercentage: number } {
    if (reqYears <= 0) {
      return {
        score: 100,
        ratioPercentage: 100,
        evaluation: `Vị trí không yêu cầu số năm kinh nghiệm tối thiểu (${candYears} năm thực tế).`,
      };
    }

    const ratio = candYears / reqYears;
    const ratioPercentage = Math.round(ratio * 100);

    let score = 0;
    let evaluation = '';

    if (candYears >= reqYears) {
      score = 100;
      evaluation = `Đáp ứng trọn vẹn hoặc vượt yêu cầu kinh nghiệm (${candYears}/${reqYears} năm, đạt ${ratioPercentage}%).`;
    } else if (candYears >= 0.5 * reqYears) {
      score = Math.round(ratio * 100);
      evaluation = `Gần tiệm cận mức yêu cầu kinh nghiệm (${candYears}/${reqYears} năm, đạt ${ratioPercentage}%).`;
    } else {
      score = Math.max(20, Math.round(ratio * 70));
      evaluation = `Chưa đủ thời gian tích lũy kinh nghiệm yêu cầu (${candYears}/${reqYears} năm, đạt ${ratioPercentage}%).`;
    }

    return { score, evaluation, ratioPercentage };
  }

  calculateEducationScore(
    educations: any[] = [],
    reqDegree: string = 'Bachelor',
    reqField: string = 'Computer Science',
  ): { score: number; evaluation: string; candidateDegree: string; fieldMatch: boolean } {
    if (!educations || educations.length === 0) {
      return {
        score: 50,
        candidateDegree: 'Không có thông tin',
        fieldMatch: false,
        evaluation: 'Chưa bóc tách được thông tin học vấn từ hồ sơ.',
      };
    }

    const degreeRanks: Record<string, number> = {
      doctorate: 5,
      phd: 5,
      'tiến sĩ': 5,
      master: 4,
      'thạc sĩ': 4,
      bachelor: 3,
      'cử nhân': 3,
      'kỹ sư': 3,
      engineer: 3,
      college: 2,
      'cao đẳng': 2,
      associate: 2,
    };

    const normReqDegree = (reqDegree || 'bachelor').toLowerCase();
    const reqRank = degreeRanks[normReqDegree] || 3;

    let highestCandRank = 1;
    let highestDegreeName = 'Khác';
    let fieldMatch = false;

    const itFields = [
      'computer science',
      'khoa học máy tính',
      'công nghệ thông tin',
      'information technology',
      'software engineering',
      'kỹ thuật phần mềm',
      'hệ thống thông tin',
      'information systems',
      'toán tin',
      'data science',
    ];

    for (const edu of educations) {
      const degreeText = (edu.degree || '').toLowerCase();
      const fieldText = (edu.fieldOfStudy || '').toLowerCase();

      for (const [degKey, degRank] of Object.entries(degreeRanks)) {
        if (degreeText.includes(degKey) && degRank > highestCandRank) {
          highestCandRank = degRank;
          highestDegreeName = edu.degree;
        }
      }

      if (itFields.some(field => fieldText.includes(field))) {
        fieldMatch = true;
      }
    }

    let score = 70;
    let evaluation = '';

    if (highestCandRank >= reqRank) {
      score = fieldMatch ? 100 : 85;
      evaluation = fieldMatch
        ? `Trình độ học vấn ${highestDegreeName} đúng chuyên ngành CNTT/Khoa học máy tính.`
        : `Trình độ ${highestDegreeName} đáp ứng yêu cầu bậc học nhưng khác chuyên ngành chính.`;
    } else {
      score = fieldMatch ? 75 : 55;
      evaluation = `Bậc học thấp hơn yêu cầu (${highestDegreeName} so với yêu cầu ${reqDegree}).`;
    }

    return { score, evaluation, candidateDegree: highestDegreeName, fieldMatch };
  }

  evaluateCandidateFit(
    dto: MatchScreeningDto,
    vectorMap?: Map<string, number[]>,
  ): MatchingResultDto {
    const profile = dto.candidateProfileData || {};
    const candSkills: string[] = [
      ...(profile.skills?.technicalSkills || []),
      ...(profile.skills?.toolsAndFrameworks || []),
      ...(profile.skills?.librariesOrFrameworks || []),
    ];

    const targetLevel = dto.targetLevel || profile.calculatedLevel || 'MIDDLE';
    const weights = this.resolveWeights(targetLevel, dto.weights);

   
    const cvText = profile.rawText || JSON.stringify(profile.summary || '');
    const jdText = dto.jobDescriptionText || (dto.requiredSkills || []).join(' ');
    const semanticScore = this.calculateSemanticScore(cvText, jdText);

   
    const skillResult = this.calculateSkillScore(
      candSkills,
      dto.requiredSkills || [],
      dto.preferredSkills || [],
      vectorMap,
    );

  
    const candYears = Number(profile.totalYearsOfExperience) || 0;
    const reqYears = Number(dto.requiredYearsOfExperience) || 0;
    const expResult = this.calculateExperienceScore(candYears, reqYears);

    
    const eduResult = this.calculateEducationScore(
      profile.education || [],
      dto.requiredDegree || 'Bachelor',
      dto.requiredFieldOfStudy || 'Computer Science',
    );

   
    const totalRaw =
      weights.semantic * semanticScore +
      weights.skill * skillResult.score +
      weights.experience * expResult.score +
      weights.education * eduResult.score;

    const totalScore = Math.max(0, Math.min(100, Math.round(totalRaw)));

   
    const warningFlags: string[] = [];
    if (skillResult.hardGateApplied) {
      warningFlags.push('Cảnh báo: Ứng viên thiếu hơn 50% số kỹ năng cốt lõi bắt buộc.');
    }
    if (candYears < reqYears * 0.5 && reqYears > 0) {
      warningFlags.push('Cảnh báo: Kinh nghiệm thực tế thiếu hụt đáng kể so với yêu cầu vị trí.');
    }

    let rationale = `Ứng viên đạt điểm tương thích tổng thể ${totalScore}/100. `;
    if (skillResult.matchedSkills.length > 0) {
      rationale += `Thế mạnh kỹ năng bao gồm: ${skillResult.matchedSkills.slice(0, 5).join(', ')}. `;
    }
    if (skillResult.missingRequired.length > 0) {
      rationale += `Điểm cần cân nhắc: Chưa tìm thấy các kỹ năng bắt buộc [${skillResult.missingRequired.join(', ')}]. `;
    } else {
      rationale += `Đáp ứng đầy đủ 100% các kỹ năng bắt buộc của vị trí. `;
    }
    rationale += expResult.evaluation;

    return {
      totalScore,
      breakdown: {
        semanticScore,
        skillScore: skillResult.score,
        experienceScore: expResult.score,
        educationScore: eduResult.score,
      },
      weightsApplied: weights,
      skillAnalysis: {
        matchedSkills: skillResult.matchedSkills,
        partialSkills: skillResult.partialSkills,
        missingRequired: skillResult.missingRequired,
        missingPreferred: skillResult.missingPreferred,
        details: skillResult.details,
      },
      experienceAnalysis: {
        candidateYears: candYears,
        requiredYears: reqYears,
        ratioPercentage: expResult.ratioPercentage,
        evaluation: expResult.evaluation,
      },
      educationAnalysis: {
        candidateDegree: eduResult.candidateDegree,
        requiredDegree: dto.requiredDegree || 'Bachelor',
        fieldMatch: eduResult.fieldMatch,
        evaluation: eduResult.evaluation,
      },
      rationale,
      warningFlags: warningFlags.length > 0 ? warningFlags : undefined,
    };
  }

 
  evaluateRankingMetrics(
    predictedRanking: { candidateId: string; score: number }[],
    groundTruthRelevance: Record<string, number>, // candidateId -> relevance score (ví dụ: 0 đến 3)
    k: number = 5,
  ): { precisionAtK: number; recallAtK: number; ndcgAtK: number } {
    const topK = predictedRanking.slice(0, k);

   
    const isRelevant = (id: string) => (groundTruthRelevance[id] || 0) >= 2;

    const totalRelevant = Object.values(groundTruthRelevance).filter(rel => rel >= 2).length;

    let relevantInTopK = 0;
    for (const item of topK) {
      if (isRelevant(item.candidateId)) {
        relevantInTopK++;
      }
    }

    const precisionAtK = topK.length > 0 ? relevantInTopK / topK.length : 0;
    const recallAtK = totalRelevant > 0 ? relevantInTopK / totalRelevant : 0;

    let dcg = 0;
    for (let i = 0; i < topK.length; i++) {
      const rel = groundTruthRelevance[topK[i].candidateId] || 0;
      dcg += (Math.pow(2, rel) - 1) / Math.log2(i + 2);
    }


    const idealRels = Object.values(groundTruthRelevance)
      .sort((a, b) => b - a)
      .slice(0, k);

    let idcg = 0;
    for (let i = 0; i < idealRels.length; i++) {
      idcg += (Math.pow(2, idealRels[i]) - 1) / Math.log2(i + 2);
    }

    const ndcgAtK = idcg > 0 ? dcg / idcg : 1.0;

    return {
      precisionAtK: Math.round(precisionAtK * 1000) / 1000,
      recallAtK: Math.round(recallAtK * 1000) / 1000,
      ndcgAtK: Math.round(ndcgAtK * 1000) / 1000,
    };
  }
}
