import { z } from 'zod';

export const CV_EXTRACTION_GEMINI_SCHEMA = {
  type: 'OBJECT',
  properties: {
    personalInfo: {
      type: 'OBJECT',
      properties: {
        fullName: { type: 'STRING' },
        email: { type: 'STRING', nullable: true },
        phone: { type: 'STRING', nullable: true },
        location: { type: 'STRING', nullable: true },
        linkedin: { type: 'STRING', nullable: true },
        github: { type: 'STRING', nullable: true },
        portfolioUrl: { type: 'STRING', nullable: true },
        currentTitle: { type: 'STRING', nullable: true },
      },
      required: ['fullName'],
    },
    summary: { type: 'STRING' },
    yearsOfExperience: { type: 'NUMBER' },
    skills: {
      type: 'OBJECT',
      properties: {
        technicalSkills: { type: 'ARRAY', items: { type: 'STRING' } },
        softSkills: { type: 'ARRAY', items: { type: 'STRING' } },
        toolsAndPlatforms: { type: 'ARRAY', items: { type: 'STRING' } },
      },
      required: ['technicalSkills', 'softSkills', 'toolsAndPlatforms'],
    },
    workExperience: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          company: { type: 'STRING' },
          role: { type: 'STRING' },
          location: { type: 'STRING', nullable: true },
          startDate: { type: 'STRING', nullable: true },
          endDate: { type: 'STRING', nullable: true },
          isCurrent: { type: 'BOOLEAN' },
          durationMonths: { type: 'NUMBER', nullable: true },
          description: { type: 'STRING' },
          responsibilities: { type: 'ARRAY', items: { type: 'STRING' } },
          achievements: { type: 'ARRAY', items: { type: 'STRING' } },
          techStack: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['company', 'role', 'isCurrent', 'description', 'responsibilities', 'achievements', 'techStack'],
      },
    },
    education: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          institution: { type: 'STRING' },
          degree: { type: 'STRING' },
          fieldOfStudy: { type: 'STRING' },
          startDate: { type: 'STRING', nullable: true },
          endDate: { type: 'STRING', nullable: true },
          graduationYear: { type: 'STRING', nullable: true },
          gpa: { type: 'STRING', nullable: true },
        },
        required: ['institution', 'degree', 'fieldOfStudy'],
      },
    },
    certifications: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          issuer: { type: 'STRING', nullable: true },
          issueDate: { type: 'STRING', nullable: true },
          expiryDate: { type: 'STRING', nullable: true },
          credentialUrl: { type: 'STRING', nullable: true },
        },
        required: ['name'],
      },
    },
    languages: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          language: { type: 'STRING' },
          proficiency: { type: 'STRING' },
        },
        required: ['language', 'proficiency'],
      },
    },
    projects: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          projectName: { type: 'STRING' },
          role: { type: 'STRING', nullable: true },
          description: { type: 'STRING' },
          startDate: { type: 'STRING', nullable: true },
          endDate: { type: 'STRING', nullable: true },
          techStack: { type: 'ARRAY', items: { type: 'STRING' } },
          projectUrl: { type: 'STRING', nullable: true },
        },
        required: ['projectName', 'description', 'techStack'],
      },
    },
  },
  required: ['personalInfo', 'summary', 'yearsOfExperience', 'skills', 'workExperience', 'education', 'certifications', 'languages', 'projects'],
};

export const PersonalInfoZodSchema = z.object({
  fullName: z.string().describe('Họ và tên đầy đủ của ứng viên'),
  email: z.string().nullable().describe('Địa chỉ email hợp lệ hoặc null'),
  phone: z.string().nullable().describe('Số điện thoại liên hệ hoặc null'),
  location: z.string().nullable().describe('Thành phố/Địa chỉ hiện tại hoặc null'),
  linkedin: z.string().nullable().describe('Đường dẫn LinkedIn hoặc null'),
  github: z.string().nullable().describe('Đường dẫn GitHub hoặc null'),
  portfolioUrl: z.string().nullable().describe('Trang web cá nhân hoặc null'),
  currentTitle: z.string().nullable().describe('Vị trí công việc hiện tại hoặc gần nhất'),
});

export const WorkExperienceZodSchema = z.object({
  company: z.string().describe('Tên công ty / tổ chức'),
  role: z.string().describe('Vị trí / chức danh làm việc'),
  location: z.string().nullable().describe('Địa điểm công ty hoặc Onsite/Remote'),
  startDate: z.string().nullable().describe('Thời gian bắt đầu: YYYY-MM hoặc YYYY'),
  endDate: z.string().nullable().describe('Thời gian kết thúc: YYYY-MM, YYYY, hoặc Present'),
  isCurrent: z.boolean().describe('true nếu hiện tại vẫn đang làm việc tại đây'),
  durationMonths: z.number().nullable().describe('Số tháng làm việc ước tính'),
  description: z.string().describe('Tóm tắt tổng quan về công việc'),
  responsibilities: z.array(z.string()).describe('Các đầu việc chính đã thực hiện'),
  achievements: z.array(z.string()).describe('Các thành tựu, giải thưởng hoặc con số nổi bật'),
  techStack: z.array(z.string()).describe('Các công nghệ, ngôn ngữ, công cụ đã dùng'),
});

export const EducationZodSchema = z.object({
  institution: z.string().describe('Tên trường Đại học / Cao đẳng / Học viện'),
  degree: z.string().describe('Bằng cấp: Cử nhân, Thạc sĩ, Kỹ sư, Trung cấp...'),
  fieldOfStudy: z.string().describe('Chuyên ngành: Khoa học máy tính, CNTT, Kinh tế...'),
  startDate: z.string().nullable().describe('Năm bắt đầu'),
  endDate: z.string().nullable().describe('Năm kết thúc'),
  graduationYear: z.string().nullable().describe('Năm tốt nghiệp'),
  gpa: z.string().nullable().describe('Điểm GPA hoặc xếp loại tốt nghiệp'),
});

export const CertificationZodSchema = z.object({
  name: z.string().describe('Tên chứng chỉ: AWS SAA, IELTS, PMP, JLPT...'),
  issuer: z.string().nullable().describe('Tổ chức cấp chứng chỉ'),
  issueDate: z.string().nullable().describe('Ngày cấp'),
  expiryDate: z.string().nullable().describe('Ngày hết hạn'),
  credentialUrl: z.string().nullable().describe('Link tra cứu chứng chỉ'),
});

export const ProjectZodSchema = z.object({
  projectName: z.string().describe('Tên dự án tiêu biểu'),
  role: z.string().nullable().describe('Vai trò trong dự án'),
  description: z.string().describe('Mô tả mục tiêu dự án và quy mô'),
  startDate: z.string().nullable().describe('Ngày bắt đầu'),
  endDate: z.string().nullable().describe('Ngày hoàn thành'),
  techStack: z.array(z.string()).describe('Các công nghệ sử dụng trong dự án'),
  projectUrl: z.string().nullable().describe('Link GitHub hoặc Live Demo'),
});

export const CandidateProfileZodSchema = z.object({
  personalInfo: PersonalInfoZodSchema,
  summary: z.string().describe('Đoạn tóm tắt bản thân hoặc mục tiêu nghề nghiệp'),
  yearsOfExperience: z.number().describe('Tổng số năm kinh nghiệm làm việc thực tế'),
  skills: z.object({
    technicalSkills: z.array(z.string()).describe('Kỹ năng kỹ thuật, ngôn ngữ lập trình, framework, DB'),
    softSkills: z.array(z.string()).describe('Kỹ năng mềm'),
    toolsAndPlatforms: z.array(z.string()).describe('Công cụ và nền tảng: Git, Docker, AWS, Figma, Jira'),
  }),
  workExperience: z.array(WorkExperienceZodSchema),
  education: z.array(EducationZodSchema),
  certifications: z.array(CertificationZodSchema),
  languages: z.array(
    z.object({
      language: z.string().describe('Tên ngôn ngữ'),
      proficiency: z.string().describe('Mức độ thành thạo: Native, Professional, Intermediate, B2...'),
    }),
  ),
  projects: z.array(ProjectZodSchema),
});

export type CandidateProfileType = z.infer<typeof CandidateProfileZodSchema>;
