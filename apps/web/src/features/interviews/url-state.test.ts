import { describe, expect, it } from 'vitest';
import {
  decodeInterviewList,
  encodeInterviewList,
  formatInterviewTime,
} from './url-state';

describe('interview URL state', () => {
  it('canonicalizes invalid pagination and view values', () => {
    const value = decodeInterviewList(
      new URLSearchParams('view=month&page=-2&limit=500&direction=sideways'),
    );
    expect(value.view).toBe('list');
    expect(value.page).toBe(1);
    expect(value.limit).toBe(20);
    expect(value.direction).toBe('asc');
  });

  it('round trips material filters and omits defaults', () => {
    const value = decodeInterviewList(
      new URLSearchParams(
        'view=agenda&status=SCHEDULED&type=TECHNICAL&interviewerId=me&feedback=pending&page=2&limit=10&tz=Africa%2FCasablanca',
      ),
    );
    const encoded = encodeInterviewList(value);
    expect(encoded).toContain('view=agenda');
    expect(encoded).toContain('interviewerId=me');
    expect(encoded).toContain('tz=Africa%2FCasablanca');
  });

  it('falls back to UTC for an invalid display zone', () => {
    expect(() =>
      formatInterviewTime('2026-01-01T12:00:00Z', 'Bad/Zone'),
    ).not.toThrow();
  });
});
