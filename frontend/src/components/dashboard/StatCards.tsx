import React from 'react';
import { Card } from '../common/Card.tsx';

export const StatCards: React.FC = () => {
  return (
    <div className="stat-cards-grid">
      <Card title="Total Screened">
        <p className="stat-value">24</p>
      </Card>
      <Card title="Avg Match Score">
        <p className="stat-value">84%</p>
      </Card>
      <Card title="Pending Interviews">
        <p className="stat-value">6</p>
      </Card>
    </div>
  );
};
