import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString({ each: true })
  @IsOptional()
  skills?: string[];
}
