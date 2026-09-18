import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CandidateState } from '../enums/candidate-state.enum';

export class UpdateCandidateStateDto {
  @IsNotEmpty()
  @IsEnum(CandidateState)
  state: CandidateState;

  @IsOptional()
  @IsString()
  comment?: string;
}
