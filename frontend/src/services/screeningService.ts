import { fetchApi } from './api';
import type { ScreeningResult } from '../types';

export const screeningService = {
  async matchCandidate(candidateId: string, jobDescriptionText: string): Promise<ScreeningResult> {
    return fetchApi<ScreeningResult>('/screening/match', {
      method: 'POST',
      body: JSON.stringify({ candidateId, jobDescriptionText }),
    });
  },
};
