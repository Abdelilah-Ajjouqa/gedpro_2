import { readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

const output = resolve(tmpdir(), `gedpro-api-schema-${process.pid}.ts`);
const source = resolve(process.cwd(), '../api/docs/openapi.json');
const committed = resolve(process.cwd(), 'src/generated/api-schema.ts');

try {
  const result = spawnSync(
    process.execPath,
    [resolve(process.cwd(), '../../node_modules/openapi-typescript/bin/cli.js'), source, '-o', output],
    { cwd: process.cwd(), encoding: 'utf8' },
  );
  if (result.status !== 0) {
    process.stderr.write(
      result.stderr || result.stdout || String(result.error ?? 'Generation failed'),
    );
    process.exit(result.status ?? 1);
  }
  const [expected, actual] = await Promise.all([
    readFile(committed, 'utf8'),
    readFile(output, 'utf8'),
  ]);
  if (expected !== actual) {
    throw new Error(
      'Generated API types are stale. Run npm run api:types:generate --workspace @gedpro/web.',
    );
  }
} finally {
  await rm(output, { force: true });
}
