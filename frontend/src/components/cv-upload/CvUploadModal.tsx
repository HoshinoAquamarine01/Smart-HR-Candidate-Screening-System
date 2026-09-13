import React from 'react';
import { Button } from '../common/Button.tsx';

export const CvUploadModal: React.FC = () => {
  return (
    <div className="cv-upload-container">
      <h3>Upload Candidate Resume (PDF / DOCX)</h3>
      <input type="file" accept=".pdf,.docx" />
      <Button variant="primary">Parse Resume</Button>
    </div>
  );
};
