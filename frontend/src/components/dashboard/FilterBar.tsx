import React from 'react';

export const FilterBar: React.FC = () => {
  return (
    <div className="filter-bar">
      <input type="text" placeholder="Search candidates..." />
      <select>
        <option value="">All Statuses</option>
        <option value="Screened">Screened</option>
        <option value="Interviewing">Interviewing</option>
      </select>
    </div>
  );
};
