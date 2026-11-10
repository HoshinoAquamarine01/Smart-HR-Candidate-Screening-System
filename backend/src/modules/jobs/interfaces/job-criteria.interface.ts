export type SeniorityLevel = 'INTERN' | 'JUNIOR' | 'MIDDLE' | 'SENIOR' | 'LEAD';
export type JobEmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface ScoringWeights {
  w_skill: number;
  w_exp: number;
  w_edu: number;
  w_semantic: number;
}

export interface JobExtractedCriteria {
  requiredSkills: string[];
  preferredSkills: string[];
  minExperienceYears: number;
  requiredEducation?: string;
  responsibilities?: string[];
  seniorityLevel?: SeniorityLevel;
}

export const LEVEL_SCORING_WEIGHT_PRESETS: Record<SeniorityLevel, ScoringWeights> = {
  INTERN: {
    w_semantic: 0.30,
    w_skill: 0.35,
    w_exp: 0.10,
    w_edu: 0.25,
  },
  JUNIOR: {
    w_semantic: 0.25,
    w_skill: 0.40,
    w_exp: 0.20,
    w_edu: 0.15,
  },
  MIDDLE: {
    w_semantic: 0.20,
    w_skill: 0.40,
    w_exp: 0.25,
    w_edu: 0.15,
  },
  SENIOR: {
    w_semantic: 0.15,
    w_skill: 0.35,
    w_exp: 0.40,
    w_edu: 0.10,
  },
  LEAD: {
    w_semantic: 0.15,
    w_skill: 0.30,
    w_exp: 0.45,
    w_edu: 0.10,
  },
};

