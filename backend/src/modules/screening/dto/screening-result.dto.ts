export interface SkillBreakdownDetail {
  skill: string;
  category: 'REQUIRED' | 'PREFERRED';
  matchedWith: string | null;
  matchScore: number;
  matchType: 'EXACT' | 'ALIAS' | 'FUZZY' | 'SEMANTIC' | 'RELATED' | 'NONE';
  rationale: string;
}

export interface ScreeningScoreBreakdown {
  semanticScore: number;
  skillScore: number;
  experienceScore: number;
  educationScore: number;
}

export interface AppliedScoringWeights {
  semantic: number;
  skill: number;
  experience: number;
  education: number;
}

export interface MatchingResultDto {
  totalScore: number;
  rankingIndex?: number;
  breakdown: ScreeningScoreBreakdown;
  weightsApplied: AppliedScoringWeights;
  skillAnalysis: {
    matchedSkills: string[];
    partialSkills: string[];
    missingRequired: string[];
    missingPreferred: string[];
    details: SkillBreakdownDetail[];
  };
  experienceAnalysis: {
    candidateYears: number;
    requiredYears: number;
    ratioPercentage: number;
    evaluation: string;
  };
  educationAnalysis: {
    candidateDegree: string;
    requiredDegree: string;
    fieldMatch: boolean;
    evaluation: string;
  };
  rationale: string;
  warningFlags?: string[];
}

