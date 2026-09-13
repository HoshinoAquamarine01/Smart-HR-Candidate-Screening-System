import React from 'react';
import type { ScoreBreakdown } from '../../types';

interface Props {
  breakdown?: ScoreBreakdown;
}

export const MatchScoreBreakdown: React.FC<Props> = () => {
  return (
    <div className="score-breakdown">
      <h4>Match Breakdown</h4>
      <ul>
        <li>Technical Skill Fit: 90%</li>
        <li>Seniority Fit: 85%</li>
        <li>Domain Relevance: 89%</li>
      </ul>
    </div>
  );
};
