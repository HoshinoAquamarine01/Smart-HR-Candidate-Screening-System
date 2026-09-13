import { fetchApi } from './api';
import type { CvParseResponse } from '../types';

export const cvService = {
  async parseCv(formData: FormData): Promise<CvParseResponse> {
    return fetchApi<CvParseResponse>('/cv/parse', {
      method: 'POST',
      body: formData,
    });
  },
};
