import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { OpenAPIObject } from '@nestjs/swagger';
import { completeResponseContent } from './openapi';

describe('OpenAPI response contracts', () => {
  it('replaces every legacy free-form successful response', () => {
    const path = resolve(process.cwd(), 'docs', 'openapi.json');
    const document = JSON.parse(readFileSync(path, 'utf8')) as OpenAPIObject;

    completeResponseContent(document);

    for (const item of Object.values(document.paths)) {
      for (const operation of Object.values(item ?? {})) {
        if (
          !operation ||
          typeof operation !== 'object' ||
          !('responses' in operation)
        )
          continue;
        for (const [status, response] of Object.entries(operation.responses)) {
          if (!status.startsWith('2') || !response || '$ref' in response)
            continue;
          const schema = response.content?.['application/json']?.schema;
          if (!schema || '$ref' in schema) continue;
          expect(schema.description ?? '').not.toMatch(/^Free-form JSON/);
        }
      }
    }
  });
});
