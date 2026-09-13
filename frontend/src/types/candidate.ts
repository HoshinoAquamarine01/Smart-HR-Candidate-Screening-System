export interface ExperienceItem {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  description: string;
  techStack: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: number;
}

export interface CandidateProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  roleTitle: string;
  matchScore: number;
  status: 'New' | 'Screened' | 'Interviewing' | 'Assessed' | 'Hired' | 'Rejected';
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  createdAt: string;
}
