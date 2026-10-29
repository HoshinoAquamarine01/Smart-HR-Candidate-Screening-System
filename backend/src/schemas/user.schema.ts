import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose'
import {HydratedDocument} from 'mongoose'

export type UserDocument= HydratedDocument<User>
@Schema({timestamps: true})
export class User {
   @Prop({required: true,unique: true})
   email: string;

   @Prop({required: true})
   passwordHash: string;

   @Prop({required: true})
   fullName: string;

   @Prop({required: true, enum: ['ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER']})
   role: string; 

   @Prop()
   department: string;

   @Prop({required:true,enum:['ACTIVE', 'INACTIVE'], default:'ACTIVE'})
   status: string;

   
}

export const UserSchema = SchemaFactory.createForClass(User)