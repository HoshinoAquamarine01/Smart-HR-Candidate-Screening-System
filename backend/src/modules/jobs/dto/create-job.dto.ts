import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import type {
  JobEmploymentType,
  JobStatus,
  SeniorityLevel,
} from '../interfaces/job-criteria.interface';

export class CreateJobDto {
  @IsNotEmpty({ message: 'Tiêu đề công việc không được để trống' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  department?: string = 'Công nghệ thông tin';

  @IsOptional()
  @IsString()
  location?: string = 'Hà Nội / Hybrid';

  @IsOptional()
  @IsEnum(['FULL_TIME', 'PART_TIME', 'CONTRACT'])
  employmentType?: JobEmploymentType = 'FULL_TIME';

  @IsNotEmpty({ message: 'Nội dung mô tả công việc (JD) không được để trống' })
  @IsString()
  @MinLength(20, { message: 'Nội dung JD phải có ít nhất 20 ký tự để AI phân tích' })
  rawDescription: string;

  @IsOptional()
  @IsBoolean()
  autoExtract?: boolean = true;

  @IsOptional()
  @IsEnum(['INTERN', 'JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD'])
  seniorityLevel?: SeniorityLevel;

  @IsOptional()
  @IsObject()
  extractedCriteria?: {
    requiredSkills?: string[];
    preferredSkills?: string[];
    minExperienceYears?: number;
    requiredEducation?: string;
    responsibilities?: string[];
    seniorityLevel?: SeniorityLevel;
  };

  @IsOptional()
  @IsObject()
  scoringWeights?: {
    w_skill: number;
    w_exp: number;
    w_edu: number;
    w_semantic: number;
  };

  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'CLOSED'])
  status?: JobStatus = 'PUBLISHED';
}

