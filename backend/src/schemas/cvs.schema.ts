import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { Candidates } from './candidates.schema';
import { User } from './user.schema';

export type CvsDocument = HydratedDocument<Cvs>;

@Schema({ timestamps: true })
export class Cvs {
  @Prop({ type: SchemaTypes.ObjectId, ref: Candidates.name, required: true, index: true })
  candidateId: Types.ObjectId;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ type: Object, default: {} })
  parsedData: Record<string, any>;

  @Prop({ type: [Number], default: [] })
  embedding: number[];

  @Prop({ type: SchemaTypes.ObjectId, ref: User.name, required: true })
  uploadedBy: Types.ObjectId;
}

export const CvsSchema = SchemaFactory.createForClass(Cvs);
