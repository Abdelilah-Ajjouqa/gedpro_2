import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UploadDocumentDto {
  @ApiPropertyOptional({
    description: 'Candidate whose journey should include this document',
  })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  candidateId?: number;
}
