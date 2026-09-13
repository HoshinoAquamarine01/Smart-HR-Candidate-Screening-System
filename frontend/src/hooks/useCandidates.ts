import { useState, useEffect } from 'react';
import type { CandidateProfile } from '../types';
import { candidateService } from '../services/candidateService';

export function useCandidates() {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCandidates() {
      setLoading(true);
      try {
        const data = await candidateService.getCandidates();
        setCandidates(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch candidates');
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, []);

  return { candidates, loading, error };
}
