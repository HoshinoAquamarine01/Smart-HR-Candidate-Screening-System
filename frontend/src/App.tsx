import { useState } from 'react';
import { Header } from './components/common/Header.tsx';
import { Sidebar } from './components/common/Sidebar.tsx';
import { HRDashboard } from './components/dashboard/HRDashboard.tsx';
import { CvUploadModal } from './components/cv-upload/CvUploadModal.tsx';
import { InterviewQuestionList } from './components/interview/InterviewQuestionList.tsx';
import { TechnicalTestView } from './components/interview/TechnicalTestView.tsx';
import { AppProvider } from './context/AppContext.tsx';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  return (
    <div className="app-shell">
      <Header />
      <div className="app-main">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="app-content">
          {activeTab === 'dashboard' && <HRDashboard />}
          {activeTab === 'upload' && <CvUploadModal />}
          {activeTab === 'interviews' && <InterviewQuestionList />}
          {activeTab === 'assessments' && <TechnicalTestView />}
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
