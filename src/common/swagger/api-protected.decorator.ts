import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorDto } from './api-error.dto';

export function ApiProtected() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Missing, invalid, or expired access token', type: ApiErrorDto }),
    ApiForbiddenResponse({ description: 'The authenticated user lacks the required role', type: ApiErrorDto }),
  );
}
