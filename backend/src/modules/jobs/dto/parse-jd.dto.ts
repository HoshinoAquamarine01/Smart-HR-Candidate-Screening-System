import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ParseJdDto {
  @IsNotEmpty({ message: 'Văn bản JD không được để trống' })
  @IsString()
  @MinLength(20, { message: 'Văn bản JD phải có ít nhất 20 ký tự' })
  rawDescription: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;
}

