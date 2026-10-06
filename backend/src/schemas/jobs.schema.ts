import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { User } from './user.schema';

export type JobsDocument = HydratedDocument<Jobs>;

@Schema({ timestamps: true })
export class Jobs {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  department: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true, enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT'] })
  employmentType: string;

  @Prop({ required: true })
  rawDescription: string;

  @Prop({ type: Object, required: true })
  extractedCriteria: Record<string, any>;

  @Prop({ type: Object, required: true })
  scoringWeights: Record<string, any>;

  @Prop({ type: [Number], default: [] })
  embedding: number[];

  @Prop({ type: SchemaTypes.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true, enum: ['DRAFT', 'PUBLISHED', 'CLOSED'], default: 'DRAFT' })
  status: string;
}

export const JobsSchema = SchemaFactory.createForClass(Jobs);
