import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdir } from 'node:fs/promises';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { configureApiVersionAlias } from './common/middleware/api-version.middleware';

async function bootstrap() {
  await mkdir(process.env.UPLOAD_DIR ?? 'uploads', { recursive: true });
  const app = await NestFactory.create(AppModule);
  configureApiVersionAlias(app);
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

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
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'GEDPro API Documentation',
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
