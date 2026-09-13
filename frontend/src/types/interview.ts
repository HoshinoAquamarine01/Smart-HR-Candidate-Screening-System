export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  expectedKeyPoints: string[];
  rationale?: string;
}

export interface TechnicalAssessment {
  id: string;
  title: string;
  durationMinutes: number;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}
