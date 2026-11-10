import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { QuestionDifficulty } from '../interfaces/interview-question.interface';

export class GenerateInterviewDto {
  @IsOptional()
  @IsString()
  applicationId?: string;

  @IsOptional()
  @IsString()
  candidateId?: string;

  @IsOptional()
  @IsString()
  jobId?: string;

  @IsOptional()
  @IsString()
  jobDescriptionText?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusAreas?: string[];

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(12)
  numQuestions?: number = 6;

  @IsOptional()
  @IsEnum(['EASY', 'MEDIUM', 'HARD'])
  targetDifficulty?: QuestionDifficulty;

  @IsOptional()
  @IsBoolean()
  regenerate?: boolean = false;
}
