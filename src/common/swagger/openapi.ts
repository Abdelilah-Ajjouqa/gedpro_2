import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import type { OperationObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
const binaryResponses = new Map<string, string>([
  ['GET /documents/{id}/download', 'application/octet-stream'],
  ['GET /document-download/{id}', 'application/octet-stream'],
  ['GET /reports/exports/{id}/download', 'application/octet-stream'],
  ['GET /forms/{id}/responses/export', 'text/csv'],
]);

function completeResponseContent(document: OpenAPIObject) {
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
        if (response.content && Object.keys(response.content).length > 0)
          continue;

        const mediaType =
          binaryResponses.get(`${method.toUpperCase()} ${path}`) ??
          'application/json';
        response.content = {
          [mediaType]: {
            schema:
              mediaType === 'application/json'
                ? {
                    type: 'object',
                    additionalProperties: true,
                    description:
                      'Free-form JSON response. Prefer generated component schemas where available.',
                  }
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
