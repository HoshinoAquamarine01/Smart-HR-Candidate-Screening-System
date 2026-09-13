import React from 'react';
import { Card } from '../common/Card.tsx';

interface Props {
  rationale?: string;
}

export const RationaleCard: React.FC<Props> = ({ rationale }) => {
  return (
    <Card title="AI Screening Rationale">
      <p>{rationale || 'Candidate possesses relevant high-level architecture experience...'}</p>
    </Card>
  );
};
