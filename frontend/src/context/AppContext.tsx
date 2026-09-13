import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { CandidateProfile } from '../types';

interface AppContextType {
  selectedCandidate: CandidateProfile | null;
  setSelectedCandidate: (candidate: CandidateProfile | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  return (
    <AppContext.Provider
      value={{
        selectedCandidate,
        setSelectedCandidate,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
