import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'ADMIN',
  HR_MANAGER = 'HR_MANAGER',
  RECRUITER = 'RECRUITER',
  HIRING_MANAGER = 'HIRING_MANAGER',
}

export class RegisterDto {
  @ApiProperty({
    example: 'recruiter@smarthr.io',
    description: 'Địa chỉ email đăng ký tài khoản',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Mật khẩu bảo mật (từ 6 đến 32 ký tự)',
    minLength: 6,
    maxLength: 32,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(32)
  password: string;

  @ApiProperty({
    example: 'Nguyễn Văn Hoàng',
    description: 'Họ và tên đầy đủ của người dùng',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.RECRUITER,
    description: 'Vai trò người dùng trong hệ thống',
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.RECRUITER;

  @ApiPropertyOptional({
    example: 'Talent Acquisition Department',
    description: 'Phòng ban làm việc',
  })
  @IsString()
  @IsOptional()
  department?: string;
}
