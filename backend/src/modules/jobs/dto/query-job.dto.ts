import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type {
  JobEmploymentType,
  JobStatus,
} from '../interfaces/job-criteria.interface';

export class QueryJobDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'CLOSED'])
  status?: JobStatus;

  @IsOptional()
  @IsEnum(['FULL_TIME', 'PART_TIME', 'CONTRACT'])
  employmentType?: JobEmploymentType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

