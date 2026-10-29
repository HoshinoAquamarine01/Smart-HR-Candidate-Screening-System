import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { Candidates } from './candidates.schema';
import { Jobs } from './jobs.schema';
import { Cvs } from './cvs.schema';

export type ApplicationsDocument = HydratedDocument<Applications>;

export enum CandidateStatus {
  NEW = 'NEW',
  SCREENING = 'SCREENING',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

export enum AiPipelineStatus {
  UPLOADED = 'UPLOADED',
  PARSING = 'PARSING',
  MATCHING = 'MATCHING',
  SCORING = 'SCORING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class Applications {
  @Prop({ type: SchemaTypes.ObjectId, ref: Candidates.name, required: true, index: true })
  candidateId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: Jobs.name, required: true, index: true })
  jobId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: Cvs.name, required: true })
  cvId: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(CandidateStatus),
    default: CandidateStatus.NEW,
  })
  candidateStatus: string;

  @Prop({
    required: true,
    enum: Object.values(AiPipelineStatus),
    default: AiPipelineStatus.UPLOADED,
  })
  aiPipelineStatus: string;

  @Prop({ type: Object, required: false })
  recruiterDecision?: Record<string, any>;

  @Prop({ type: Date, default: Date.now, index: true })
  appliedAt: Date;
}

export const ApplicationsSchema = SchemaFactory.createForClass(Applications);
