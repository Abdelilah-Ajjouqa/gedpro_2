import {
  normalizeEmail,
  normalizeLabels,
  normalizePhone,
} from './candidate-normalization';
describe('candidate normalization', () => {
  it('normalizes duplicate identifiers', () => {
    expect(normalizeEmail(' Alice@Example.COM ')).toBe('alice@example.com');
    expect(normalizePhone('+212 (600) 12-34')).toBe('+2126001234');
  });
  it('normalizes and deduplicates labels', () => {
    expect(normalizeLabels([' TypeScript ', 'typescript', 'NestJS'])).toEqual([
      'typescript',
      'nestjs',
    ]);
  });
});
