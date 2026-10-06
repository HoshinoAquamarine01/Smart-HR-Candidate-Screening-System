import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { User } from './user.schema';

export type AuditLogsDocument = HydratedDocument<AuditLogs>;

@Schema({ timestamps: true })
export class AuditLogs {
  @Prop({ type: SchemaTypes.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  entity: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  entityId: Types.ObjectId;

  @Prop({ type: Object, required: false })
  oldValue?: Record<string, any>;

  @Prop({ type: Object, required: false })
  newValue?: Record<string, any>;

  @Prop({ required: false })
  ipAddress?: string;
}

export const AuditLogsSchema = SchemaFactory.createForClass(AuditLogs);
