import { IsEnum, IsOptional } from 'class-validator';

export class ExportInterviewDto {
  @IsOptional()
  @IsEnum(['markdown', 'text', 'json'])
  format?: 'markdown' | 'text' | 'json' = 'markdown';
}

