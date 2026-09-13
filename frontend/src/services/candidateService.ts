import { fetchApi } from './api';
import type { CandidateProfile } from '../types';

export const candidateService = {
  async getCandidates(): Promise<CandidateProfile[]> {
    return fetchApi<CandidateProfile[]>('/candidates');
  },

  async getCandidateById(id: string): Promise<CandidateProfile> {
    return fetchApi<CandidateProfile>(`/candidates/${id}`);
  },
};
