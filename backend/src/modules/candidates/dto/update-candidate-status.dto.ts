import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CandidateStatus } from '../../../schemas/applications.schema';

export class UpdateCandidateStatusDto {
  @IsNotEmpty({ message: 'Trạng thái ứng viên không được để trống' })
  @IsEnum(CandidateStatus, {
    message: 'Trạng thái phải là: NEW, SCREENING, SHORTLISTED, INTERVIEW, OFFER, HIRED hoặc REJECTED',
  })
  status: CandidateStatus;

  @IsOptional()
  @IsString()
  jobId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

