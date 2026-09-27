import { describe, expect, it } from 'vitest';
import { parseSessionEvent, parseStoredSessionEvent } from './session-events';

describe('session event parsing', () => {
  it('accepts only known non-sensitive event names', () => {
    expect(parseSessionEvent('logout')).toBe('logout');
    expect(parseSessionEvent('expired')).toBe('expired');
    expect(parseSessionEvent('token')).toBeUndefined();
  });

  it('ignores invalid fallback messages', () => {
    expect(parseStoredSessionEvent('{')).toBeUndefined();
    expect(parseStoredSessionEvent('{"event":"changed"}')).toBe('changed');
    expect(parseStoredSessionEvent('{"event":"credentials"}')).toBeUndefined();
  });
});
