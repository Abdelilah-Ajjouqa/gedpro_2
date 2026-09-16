import { LocalAdvisoryAiProvider } from './ai-provider';

describe('LocalAdvisoryAiProvider', () => {
  const provider = new LocalAdvisoryAiProvider();
  it('extracts editable CV fields without inventing missing values', () => {
    expect(
      provider.extractCv(
        'Ada Lovelace\nada@example.com\n+44 20 1234 5678\nTypeScript and PostgreSQL',
      ),
    ).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      skills: ['typescript', 'postgresql'],
    });
  });
  it('returns stable evidence for semantic overlap', () => {
    expect(
      provider.similarity(
        'Senior TypeScript SQL engineer',
        'typescript react sql',
      ),
    ).toMatchObject({ terms: ['typescript', 'sql'] });
  });
  it('generates behavioral questions rather than decisions', () => {
    const questions = provider.questions('Engineer', ['TypeScript'], [], 2);
    expect(questions).toHaveLength(2);
    expect(questions.join(' ')).not.toMatch(/hire|reject/i);
  });
});
