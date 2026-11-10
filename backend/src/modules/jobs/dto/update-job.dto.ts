import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import type {
  JobEmploymentType,
  JobStatus,
  SeniorityLevel,
} from '../interfaces/job-criteria.interface';

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(['FULL_TIME', 'PART_TIME', 'CONTRACT'])
  employmentType?: JobEmploymentType;

  @IsOptional()
  @IsString()
  rawDescription?: string;

  @IsOptional()
  @IsBoolean()
  reExtract?: boolean;

  @IsOptional()
  @IsEnum(['INTERN', 'JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD'])
  seniorityLevel?: SeniorityLevel;

  @IsOptional()
  @IsObject()
  extractedCriteria?: Record<string, any>;

  @IsOptional()
  @IsObject()
  scoringWeights?: Record<string, any>;

  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'CLOSED'])
  status?: JobStatus;
}

