import { HttpException, HttpStatus } from '@nestjs/common';

export function parseRequiredEtag(value?: string): number {
  if (!value)
    throw new HttpException(
      { code: 'PRECONDITION_REQUIRED', message: 'If-Match is required' },
      428,
    );
  const match = /^(?:W\/)?"(\d+)"$/.exec(value.trim());
  if (!match)
    throw new HttpException(
      {
        code: 'INVALID_PRECONDITION',
        message: 'If-Match must be a quoted integer ETag',
      },
      HttpStatus.BAD_REQUEST,
    );
  return Number(match[1]);
}

export function quoteEtag(version: number) {
  return `"${version}"`;
}
