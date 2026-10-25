export interface StandardPersonalInfo {
  fullName: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  github: string | null;
  portfolioUrl: string | null;
  currentTitle: string | null;
}

export interface StandardWorkExperience {
  company: string;
  role: string;
  location?: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  durationMonths?: number | null;
  description: string;
  responsibilities: string[];
  achievements: string[];
  techStack: string[];
}

export interface StandardEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate?: string | null;
  endDate?: string | null;
  graduationYear?: string | null;
  gpa?: string | null;
}

export interface StandardLanguage {
  language: string;
  proficiency: string;
}

export interface StandardProject {
  projectName: string;
  role?: string | null;
  description: string;
  startDate?: string | null;
  endDate?: string | null;
  techStack: string[];
  projectUrl?: string | null;
}

export interface StandardCertification {
  name: string;
  issuer?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  credentialUrl?: string | null;
}

export interface StandardSkills {
  technicalSkills: string[];
  softSkills: string[];
  toolsAndPlatforms: string[];
}

export interface StandardCvProfile {
  personalInfo: StandardPersonalInfo;
  summary: string;
  yearsOfExperience: number;
  skills: StandardSkills;
  workExperience: StandardWorkExperience[];
  education: StandardEducation[];
  certifications: StandardCertification[];
  languages: StandardLanguage[];
  projects: StandardProject[];
}

export interface ExtractionMetadata {
  extractorModel: string;
  confidenceScore: number;
  processingTimeMs: number;
  tokensUsed?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  extractedAt: Date;
}

export interface FullParsedCvData {
  profile: StandardCvProfile;
  ocrMetadata: {
    rawLength?: number;
    cleanedLength?: number;
    characterCount?: number;
    wordCount?: number;
    extractorUsed?: string;
    isScanned?: boolean;
    confidenceScore?: number;
    [key: string]: any;
  };
  extractionMetadata: ExtractionMetadata;
}
