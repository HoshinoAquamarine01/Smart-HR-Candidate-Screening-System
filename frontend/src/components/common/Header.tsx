import React from 'react';
import { APP_NAME } from '../../utils/constants';

export const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-brand">
        <h1>⚡ {APP_NAME}</h1>
      </div>
      <div className="header-actions">
        <span className="user-badge">HR Administrator</span>
      </div>
    </header>
  );
};
