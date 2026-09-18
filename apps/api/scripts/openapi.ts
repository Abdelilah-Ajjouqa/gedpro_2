import { NestFactory } from '@nestjs/core';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AppModule } from '../src/app.module';
import {
  completeResponseContent,
  createOpenApiDocument,
} from '../src/common/swagger/openapi';
import type { OpenAPIObject } from '@nestjs/swagger';
import type {
  OperationObject,
  ResponseObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

const outputPath = resolve(process.cwd(), 'docs', 'openapi.json');
process.env.DISABLE_BACKGROUND_WORKERS = 'true';

async function main() {
  if (process.argv.includes('--refresh-responses')) {
    const { readFile } = await import('node:fs/promises');
    const document = JSON.parse(
      await readFile(outputPath, 'utf8'),
    ) as OpenAPIObject;
    completeResponseContent(document);
    await writeFile(
      outputPath,
      `${JSON.stringify(document, null, 2)}\n`,
      'utf8',
    );
    return;
  }

  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();

  try {
    const document = createOpenApiDocument(app);
    for (const [path, item] of Object.entries(document.paths)) {
      for (const [method, operation] of Object.entries(item ?? {})) {
        if (method === '$ref' || method === 'parameters') continue;
        const responses = (operation as OperationObject).responses;
        const successes = Object.entries(responses).filter(([code]) =>
          code.startsWith('2'),
        );
        if (successes.length === 0) {
          throw new Error(
            `${method.toUpperCase()} ${path} has no success response`,
          );
        }
        for (const [status, responseOrReference] of successes) {
          const response = responseOrReference as ResponseObject;
          if (status === '204' || '$ref' in response) continue;
          if (!response.content || Object.keys(response.content).length === 0) {
            throw new Error(
              `${method.toUpperCase()} ${path} response ${status} has no content schema`,
            );
          }
        }
      }
    }
    const serialized = `${JSON.stringify(document, null, 2)}\n`;

    if (process.argv.includes('--check')) {
      const { readFile } = await import('node:fs/promises');
      const committed = await readFile(outputPath, 'utf8');
      if (committed !== serialized) {
        throw new Error(
          'docs/openapi.json is stale. Run `npm run openapi:generate` and commit the result.',
        );
      }
      return;
    }

    await writeFile(outputPath, serialized, 'utf8');
  } finally {
    await app.close();
  }
}

void main();
