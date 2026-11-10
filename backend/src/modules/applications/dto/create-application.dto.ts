import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { CandidateStatus, AiPipelineStatus } from '../../../schemas/applications.schema';

export class CreateApplicationDto {
  @IsNotEmpty({ message: 'Mã ứng viên (candidateId) không được để trống' })
  @IsString()
  candidateId: string;

  @IsNotEmpty({ message: 'Mã tin tuyển dụng (jobId) không được để trống' })
  @IsString()
  jobId: string;

  @IsNotEmpty({ message: 'Mã hồ sơ CV (cvId) không được để trống' })
  @IsString()
  cvId: string;

  @IsOptional()
  @IsEnum(CandidateStatus, {
    message: 'Trạng thái ứng viên phải là một trong các giá trị: NEW, SCREENING, SHORTLISTED, INTERVIEW, OFFER, HIRED, REJECTED',
  })
  candidateStatus?: CandidateStatus;

  @IsOptional()
  @IsEnum(AiPipelineStatus)
  aiPipelineStatus?: AiPipelineStatus;

  @IsOptional()
  @IsObject()
  recruiterDecision?: Record<string, any>;
}

