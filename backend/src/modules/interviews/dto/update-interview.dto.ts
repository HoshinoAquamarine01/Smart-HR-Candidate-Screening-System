import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { InterviewQuestionItem } from '../interfaces/interview-question.interface';
import { QuestionStatus } from '../../../schemas/interview_questions.schema';

export class UpdateInterviewQuestionsDto {
  @IsOptional()
  @IsArray()
  questions?: InterviewQuestionItem[];

  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

