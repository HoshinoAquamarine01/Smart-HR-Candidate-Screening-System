import { fetchApi } from './api';
import type { InterviewQuestion, TechnicalAssessment } from '../types';

export const interviewService = {
  async generateQuestions(candidateId: string): Promise<InterviewQuestion[]> {
    return fetchApi<InterviewQuestion[]>('/interviews/generate', {
      method: 'POST',
      body: JSON.stringify({ candidateId }),
    });
  },

  async createAssessment(candidateId: string): Promise<TechnicalAssessment> {
    return fetchApi<TechnicalAssessment>('/assessments/create', {
      method: 'POST',
      body: JSON.stringify({ candidateId }),
    });
  },
};
