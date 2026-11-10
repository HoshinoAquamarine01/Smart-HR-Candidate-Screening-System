export type InterviewCategory =
  | 'CLARIFICATION'
  | 'TECHNICAL_DEEP_DIVE'
  | 'SKILL_GAP'
  | 'BEHAVIORAL_STAR';

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface SampleRubric {
  poor: string;       // 1-2 points: Vague, incorrect, or missing fundamental concept
  acceptable: string; // 3-4 points: Explains key concepts, mentions realistic implementation
  excellent: string;  // 5 points: Deep architectural insight, handles trade-offs, edge-cases
}

export interface InterviewQuestionItem {
  id: string;
  category: InterviewCategory;
  question: string;
  purpose: string;
  difficulty: QuestionDifficulty;
  relatedSkill?: string;
  contextFromCV?: string;
  expectedKeyPoints: string[];
  sampleRubric: SampleRubric;
  scoreGiven?: number; // 1 to 5 points assigned during actual interview
  notes?: string;      // Notes taken by interviewer
}

export interface QuestionTemplate {
  id: string;
  category: InterviewCategory;
  skillOrCompetency: string;
  difficulty: QuestionDifficulty;
  templateQuestion: string;
  purpose: string;
  expectedCriteria: string[];
  rubricLevels: SampleRubric;
  tags: string[];
  embedding?: number[];
}

export interface InterviewGenerationPromptContext {
  jobTitle: string;
  department?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minExperienceYears: number;
  candidateName: string;
  currentTitle?: string;
  totalYearsExperience: number;
  candidateSkills: string[];
  candidateProjects: Array<{
    title: string;
    description?: string;
    technologies: string[];
    role?: string;
  }>;
  candidateWorkExperience: Array<{
    company: string;
    role: string;
    startDate?: string;
    endDate?: string;
    responsibilities?: string[];
  }>;
  missingSkills: string[];
  partiallyMatchedSkills: string[];
  overallMatchScore?: number;
  focusAreas?: string[];
  retrievedTemplates: QuestionTemplate[];
  numQuestions: number;
}

