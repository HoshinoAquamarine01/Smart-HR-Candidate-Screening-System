import React from 'react';
import { useCandidates } from '../../hooks/useCandidates.ts';
import { Badge } from '../common/Badge.tsx';

export const CandidateList: React.FC = () => {
  const { candidates, loading } = useCandidates();

  if (loading) return <div>Loading candidates...</div>;

  return (
    <div className="candidate-list">
      {candidates.map((candidate) => (
        <div key={candidate.id} className="candidate-card">
          <h4>{candidate.fullName}</h4>
          <p>{candidate.roleTitle}</p>
          <Badge label={`${candidate.matchScore}% Match`} variant="success" />
        </div>
      ))}
    </div>
  );
};
