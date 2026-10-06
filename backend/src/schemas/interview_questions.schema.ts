import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { Applications } from './applications.schema';
import { Candidates } from './candidates.schema';
import { Jobs } from './jobs.schema';
import { User } from './user.schema';

export type InterviewQuestionsDocument = HydratedDocument<InterviewQuestions>;

export enum QuestionStatus {
  GENERATED = 'GENERATED',
  REVIEWED = 'REVIEWED',
  EXPORTED = 'EXPORTED',
}

@Schema({ timestamps: true })
export class InterviewQuestions {
  @Prop({ type: SchemaTypes.ObjectId, ref: Applications.name, required: true, index: true })
  applicationId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: Candidates.name, required: true })
  candidateId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: Jobs.name, required: true })
  jobId: Types.ObjectId;

  @Prop({ type: [Object], required: true, default: [] })
  questions: Record<string, any>[];

  @Prop({
    required: true,
    enum: Object.values(QuestionStatus),
    default: QuestionStatus.GENERATED,
  })
  status: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;
}

export const InterviewQuestionsSchema = SchemaFactory.createForClass(InterviewQuestions);
