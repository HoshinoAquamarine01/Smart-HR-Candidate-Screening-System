import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CandidatesDocument = HydratedDocument<Candidates>;

@Schema({ timestamps: true })
export class Candidates {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: false, index: true })
  email?: string;

  @Prop({ required: false })
  phone?: string;

  @Prop({ required: false })
  location?: string;

  @Prop({ required: false })
  currentTitle?: string;

  @Prop({ required: false })
  summary?: string;

  @Prop({ default: false })
  anonymized: boolean;
}

export const CandidatesSchema = SchemaFactory.createForClass(Candidates);
