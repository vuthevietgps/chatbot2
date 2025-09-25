import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = User & Document;

export enum UserRole {
  DIRECTOR = 'director',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

export interface UserResponse {
  _id?: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  department?: string;
  position?: string;
  dateOfBirth?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

@Schema({ timestamps: true })
export class User {
  @ApiProperty({ description: 'User full name' })
  @Prop({ required: true })
  fullName: string;

  @ApiProperty({ description: 'User email address', uniqueItems: true })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({ description: 'User phone number' })
  @Prop({ required: true })
  phone: string;

  @ApiProperty({ description: 'User password (hashed)' })
  @Prop({ required: true })
  password: string;

  @ApiProperty({ 
    description: 'User role',
    enum: UserRole,
    example: UserRole.EMPLOYEE 
  })
  @Prop({ 
    required: true, 
    enum: UserRole,
    default: UserRole.EMPLOYEE 
  })
  role: UserRole;

  @ApiProperty({ description: 'User status' })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'User avatar URL' })
  @Prop()
  avatar?: string;

  @ApiProperty({ description: 'User department' })
  @Prop()
  department?: string;

  @ApiProperty({ description: 'User position' })
  @Prop()
  position?: string;

  @ApiProperty({ description: 'Date of birth' })
  @Prop()
  dateOfBirth?: Date;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt?: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);