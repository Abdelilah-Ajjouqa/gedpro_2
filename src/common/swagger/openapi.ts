import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import type { OperationObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import type { ReferenceObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
const binaryResponses = new Map<string, string>([
  ['GET /documents/{id}/download', 'application/octet-stream'],
  ['GET /document-download/{id}', 'application/octet-stream'],
  ['GET /reports/exports/{id}/download', 'application/octet-stream'],
  ['GET /forms/{id}/responses/export', 'text/csv'],
]);

type OpenApiSchema = SchemaObject | ReferenceObject;

const entity: SchemaObject = { type: 'object', additionalProperties: true };
const entityArray: SchemaObject = { type: 'array', items: entity };
const ref = (name: string): ReferenceObject => ({
  $ref: `#/components/schemas/${name}`,
});
const arrayOf = (items: OpenApiSchema): SchemaObject => ({
  type: 'array',
  items,
});
const message: SchemaObject = {
  type: 'object',
  required: ['message'],
  properties: { message: { type: 'string' } },
};
const pageOf = (items: OpenApiSchema): SchemaObject => ({
  type: 'object',
  required: ['data', 'total', 'page', 'limit'],
  properties: {
    data: arrayOf(items),
    total: { type: 'integer' },
    page: { type: 'integer' },
    limit: { type: 'integer' },
  },
});
const tokenPair: SchemaObject = {
  type: 'object',
  required: ['user', 'accessToken', 'refreshToken', 'token'],
  properties: {
    user: ref('User'),
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
    token: {
      type: 'string',
      description: 'Backward-compatible access-token alias',
    },
  },
};
const timelinePage: SchemaObject = {
  type: 'object',
  required: ['data', 'nextCursor'],
  properties: {
    data: entityArray,
    nextCursor: { type: 'string', nullable: true },
  },
};

/** Successful composite responses which TypeScript reflection cannot describe. */
const responseSchemas = new Map<string, OpenApiSchema>([
  [
    'DELETE /users/{id}',
    {
      type: 'object',
      properties: { affected: { type: 'integer', nullable: true } },
    },
  ],
  ['DELETE /documents/{id}', { type: 'object', nullable: true }],
  [
    'GET /documents/{id}/url',
    {
      type: 'object',
      required: ['url', 'expiresIn'],
      properties: {
        url: { type: 'string' },
        expiresIn: { type: 'integer', description: 'Lifetime in seconds' },
      },
    },
  ],
  [
    'POST /documents/maintenance/retention',
    {
      type: 'object',
      required: ['scanned', 'removed', 'failed'],
      properties: {
        scanned: { type: 'integer' },
        removed: { type: 'integer' },
        failed: { type: 'integer' },
      },
    },
  ],
  [
    'POST /documents/maintenance/orphans',
    {
      type: 'object',
      required: ['provider', 'status', 'note'],
      properties: {
        provider: { type: 'string' },
        status: { type: 'string' },
        note: { type: 'string' },
      },
    },
  ],
  ['POST /auth/register', tokenPair],
  ['POST /auth/login', tokenPair],
  ['POST /auth/refresh', tokenPair],
  ['POST /auth/password-reset/request', message],
  ['POST /auth/password-reset/confirm', message],
  ['POST /auth/email-verification/request', message],
  ['POST /auth/email-verification/confirm', message],
  ['GET /candidates/{id}/timeline', timelinePage],
  ['GET /applications/{id}/timeline', timelinePage],
  ['POST /candidates/{id}/timeline/notes', entity],
  ['POST /applications/{id}/timeline/notes', entity],
  ['GET /candidates', pageOf(ref('Candidate'))],
  [
    'GET /candidates/{id}/privacy/export',
    {
      type: 'object',
      required: ['candidate'],
      properties: {
        candidate: ref('Candidate'),
        applications: arrayOf(ref('Application')),
        documents: entityArray,
        interviews: arrayOf(ref('Interview')),
        responses: entityArray,
      },
    },
  ],
  ['POST /candidates/{id}/privacy/deletion-request', message],
  ['POST /candidates/{id}/privacy/erase', message],
  ['DELETE /forms/{id}', { type: 'object', nullable: true }],
  ['GET /forms/{id}/responses', pageOf(entity)],
  ['POST /interviews', ref('Interview')],
  ['GET /interviews/{id}', ref('Interview')],
  [
    'GET /interviews/applications/{applicationId}/decision-summary',
    {
      type: 'object',
      required: ['applicationId', 'complete', 'missing', 'scorecards'],
      properties: {
        applicationId: { type: 'integer' },
        complete: { type: 'integer' },
        missing: entityArray,
        scorecards: entityArray,
      },
    },
  ],
  ['GET /jobs', pageOf(ref('Job'))],
  ['GET /applications', pageOf(ref('Application'))],
  [
    'POST /applications/bulk-move',
    {
      type: 'object',
      required: ['results'],
      properties: { results: entityArray },
    },
  ],
  ['GET /reports/summary', entity],
  ['POST /ai/cv-extractions', entity],
  ['PATCH /ai/cv-extractions/{id}', entity],
  [
    'POST /ai/candidate-search',
    {
      type: 'object',
      required: ['generationId', 'advisory', 'results'],
      properties: {
        generationId: { type: 'integer' },
        advisory: { type: 'boolean', enum: [true] },
        results: entityArray,
      },
    },
  ],
  [
    'POST /ai/job-matches',
    {
      type: 'object',
      required: ['generationId', 'advisory', 'matches'],
      properties: {
        generationId: { type: 'integer' },
        advisory: { type: 'boolean', enum: [true] },
        matches: entityArray,
      },
    },
  ],
  [
    'POST /ai/interview-questions',
    {
      type: 'object',
      required: ['generationId', 'advisory', 'questions'],
      properties: {
        generationId: { type: 'integer' },
        advisory: { type: 'boolean', enum: [true] },
        questions: { type: 'array', items: { type: 'string' } },
      },
    },
  ],
  [
    'POST /ai/applications/{id}/summary',
    {
      type: 'object',
      required: ['generationId', 'advisory', 'summary'],
      properties: {
        generationId: { type: 'integer' },
        advisory: { type: 'boolean', enum: [true] },
        summary: { type: 'string' },
      },
    },
  ],
  ['GET /ai/monitoring', entity],
]);

export function completeResponseContent(document: OpenAPIObject) {
  for (const [path, item] of Object.entries(document.paths)) {
    for (const method of methods) {
      const operation: OperationObject | undefined = item?.[method];
      if (!operation) continue;
      for (const [status, responseOrReference] of Object.entries(
        operation.responses,
      )) {
        if (!status.startsWith('2') || status === '204') continue;
        if (!responseOrReference || '$ref' in responseOrReference) continue;
        const response = responseOrReference;
        const operationKey = `${method.toUpperCase()} ${path}`;
        const mediaType =
          binaryResponses.get(operationKey) ?? 'application/json';
        const responseSchema = responseSchemas.get(operationKey);
        const existingJsonSchema = response.content?.['application/json']
          ?.schema as SchemaObject | undefined;
        const isLegacyFallback =
          existingJsonSchema?.description?.startsWith('Free-form JSON') ??
          false;
        if (
          response.content &&
          Object.keys(response.content).length > 0 &&
          !isLegacyFallback &&
          !responseSchema
        )
          continue;
        if (mediaType === 'application/json' && !responseSchema) {
          throw new Error(
            `${method.toUpperCase()} ${path} requires an explicit success-response schema`,
          );
        }
        response.content = {
          [mediaType]: {
            schema:
              mediaType === 'application/json'
                ? responseSchema
                : { type: 'string', format: 'binary' },
          },
        };
      }
    }
  }
}

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('GEDPro API')
    .setDescription(
      'Applicant tracking API for users, candidates, jobs, applications, forms, documents, and interviews.',
    )
    .setVersion('1.0')
    .addServer('/v1', 'Version 1 (recommended)')
    .addServer('/', 'Legacy unversioned compatibility')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  completeResponseContent(document);
  return document;
}
