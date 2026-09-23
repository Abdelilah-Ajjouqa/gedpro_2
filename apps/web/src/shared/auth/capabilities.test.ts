import { describe, expect, it } from 'vitest';
import { hasAnyCapability, hasCapability } from './capabilities';

describe('capability checks', () => {
  it('denies missing and unknown capabilities', () => {
    expect(hasCapability(['jobs:read'], 'jobs:write')).toBe(false);
    expect(hasCapability([], 'unknown')).toBe(false);
  });
  it('allows an explicitly granted capability', () => {
    expect(hasAnyCapability(['jobs:read'], ['users:read', 'jobs:read'])).toBe(
      true,
    );
  });
});
