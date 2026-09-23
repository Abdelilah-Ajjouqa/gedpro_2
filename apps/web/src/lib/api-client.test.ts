import { describe, expect, it } from 'vitest';
import { ApiError } from './api-client';

describe('ApiError', () => {
  it.each([
    [400, 'validation'],
    [401, 'unauthenticated'],
    [403, 'forbidden'],
    [404, 'not-found'],
    [409, 'conflict'],
    [429, 'rate-limited'],
    [500, 'server'],
  ])('classifies %s', (status, kind) => {
    expect(new ApiError('failed', status).kind).toBe(kind);
  });
  it('preserves validation message arrays', () => {
    const error = new ApiError(['First error', 'Second error'], 400);
    expect(error.messages).toEqual(['First error', 'Second error']);
  });
});
