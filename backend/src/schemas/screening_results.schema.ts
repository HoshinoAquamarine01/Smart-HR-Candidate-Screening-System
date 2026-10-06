import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { Applications } from './applications.schema';
import { Candidates } from './candidates.schema';
import { Jobs } from './jobs.schema';

export type ScreeningResultsDocument = HydratedDocument<ScreeningResults>;

@Schema({ timestamps: true })
export class ScreeningResults {
  @Prop({ type: SchemaTypes.ObjectId, ref: Applications.name, required: true, unique: true })
  applicationId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: Candidates.name, required: true, index: true })
  candidateId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: Jobs.name, required: true, index: true })
  jobId: Types.ObjectId;

  @Prop({ required: true, min: 0, max: 100 })
  skillMatchScore: number;

  @Prop({ required: true, min: 0, max: 100 })
  experienceMatchScore: number;

  @Prop({ required: true, min: 0, max: 100 })
  educationMatchScore: number;

  @Prop({ required: true, min: 0, max: 100 })
  certificationMatchScore: number;

  @Prop({ required: true, min: 0, max: 100, index: true })
  overallMatchScore: number;

  @Prop({ type: [Object], required: true, default: [] })
  detailedMatching: Record<string, any>[];

  @Prop({ type: Object, required: true })
  aiRationale: Record<string, any>;

  @Prop({ type: Object, required: true })
  metadata: Record<string, any>;
}

export const ScreeningResultsSchema = SchemaFactory.createForClass(ScreeningResults);
