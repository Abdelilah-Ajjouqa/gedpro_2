import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorDto {
  @ApiProperty({ example: 400 }) statusCode: number;
  @ApiProperty({ example: 'Bad Request' }) error: string;
  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: ['title should not be empty'],
  })
  message: string | string[];
  @ApiProperty({ example: '/jobs' }) path: string;
  @ApiProperty({ example: '2026-09-15T10:00:00.000Z' }) timestamp: string;
}
