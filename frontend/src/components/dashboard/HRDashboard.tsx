import React from 'react';
import { StatCards } from './StatCards.tsx';
import { FilterBar } from './FilterBar.tsx';
import { CandidateList } from './CandidateList.tsx';

export const HRDashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <h2>HR Candidate Screening Pipeline</h2>
      <StatCards />
      <FilterBar />
      <CandidateList />
    </div>
  );
};
