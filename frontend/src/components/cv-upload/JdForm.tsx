import React from 'react';
import { Button } from '../common/Button.tsx';

export const JdForm: React.FC = () => {
  return (
    <div className="jd-form">
      <h3>Target Job Description</h3>
      <textarea placeholder="Paste Job Description requirements..." rows={6} />
      <Button variant="secondary">Save & Match</Button>
    </div>
  );
};
