import { Injectable } from '@nestjs/common';

const words = (value: string) => [
  ...new Set(value.toLowerCase().match(/[a-z0-9+#.]{2,}/g) ?? []),
];

@Injectable()
export class LocalAdvisoryAiProvider {
  readonly model = 'gedpro-local-advisory-v1';
  extractCv(text: string) {
    const email = text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0];
    const phone = text.match(/(?:\+?\d[\d ()-]{7,}\d)/)?.[0];
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const known = [
      'typescript',
      'javascript',
      'nestjs',
      'node.js',
      'python',
      'java',
      'react',
      'sql',
      'postgresql',
      'mongodb',
      'aws',
      'docker',
      'kubernetes',
    ];
    const tokens = new Set(words(text));
    return {
      name: lines[0]?.slice(0, 160) ?? null,
      email: email ?? null,
      phone: phone ?? null,
      skills: known.filter((skill) => tokens.has(skill)),
      highlights: lines.slice(1, 6),
    };
  }
  similarity(a: string, b: string) {
    const left = new Set(words(a));
    const right = new Set(words(b));
    const overlap = [...left].filter((item) => right.has(item));
    const score =
      left.size && right.size
        ? overlap.length / Math.sqrt(left.size * right.size)
        : 0;
    return {
      score: Math.round(score * 1000) / 1000,
      terms: overlap.slice(0, 12),
    };
  }
  questions(job: string, skills: string[], focus: string[], count: number) {
    const areas = [...new Set([...focus, ...skills])].slice(0, count);
    const result = areas.map(
      (area) =>
        `Tell us about a specific time you applied ${area}. What was your contribution and measurable result?`,
    );
    while (result.length < count)
      result.push(
        `Which experience best demonstrates your readiness for ${job}, and what did you learn from it?`,
      );
    return result;
  }
  tokens(value: unknown) {
    return Math.ceil(JSON.stringify(value).length / 4);
  }
}
