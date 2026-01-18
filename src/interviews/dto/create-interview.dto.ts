import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsArray } from 'class-validator';
import { InterviewType } from '../enums/interview-type.enum';

export class CreateInterviewDto {
    @IsNumber()
    candidateId: number;

    @IsDateString()
    date: Date;

    @IsEnum(InterviewType)
    @IsOptional()
    type?: InterviewType = InterviewType.HR;

    @IsNumber()
    @IsOptional()
    duration?: number = 60; // Default 60 mins

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsArray()
    @IsOptional()
    attendees?: number[]; // Array of User IDs
}
