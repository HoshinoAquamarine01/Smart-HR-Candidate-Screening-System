export interface ScoreBreakdown {
  technicalSkillFit: number;
  seniorityMatch: number;
  domainRelevance: number;
}

export interface ScreeningResult {
  candidateId: string;
  matchScore: number;
  breakdown: ScoreBreakdown;
  rationaleSummary: string;
  keyStrengths: string[];
  skillGaps: string[];
}
