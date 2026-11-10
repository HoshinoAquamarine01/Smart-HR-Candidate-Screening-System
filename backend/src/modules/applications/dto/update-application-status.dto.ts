import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { CandidateStatus } from '../../../schemas/applications.schema';

export class UpdateApplicationStatusDto {
  @IsNotEmpty({ message: 'Trạng thái ứng viên (status) không được để trống' })
  @IsEnum(CandidateStatus, {
    message: 'Trạng thái ứng viên phải là một trong các giá trị: NEW, SCREENING, SHORTLISTED, INTERVIEW, OFFER, HIRED, REJECTED',
  })
  status: CandidateStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  decidedBy?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsObject()
  offerDetails?: Record<string, any>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

