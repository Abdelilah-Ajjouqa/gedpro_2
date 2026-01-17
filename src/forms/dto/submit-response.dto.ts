import { IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class SubmitResponseDto {
    @IsNotEmpty()
    @IsObject()
    answers: Record<string, any>;

    @IsOptional()
    candidateId?: number;
}
