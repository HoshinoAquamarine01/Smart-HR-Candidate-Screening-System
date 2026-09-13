import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'info' }) => {
  return <span className={`badge badge-${variant}`}>{label}</span>;
};
