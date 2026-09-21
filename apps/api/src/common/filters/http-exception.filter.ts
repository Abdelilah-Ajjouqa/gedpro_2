import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { getRequestId } from '../observability/request-context';

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
  requestId?: string;
  code?: string;
  expectedVersion?: number;
  currentVersion?: number;
  issues?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const details =
      typeof payload === 'object' && payload !== null
        ? (payload as Record<string, unknown>)
        : {};
    const message =
      status === Number(HttpStatus.INTERNAL_SERVER_ERROR)
        ? 'Internal server error'
        : ((details.message as string | string[] | undefined) ??
          String(payload ?? 'Request failed'));

    const exceptionName =
      exception instanceof HttpException
        ? exception.name
            .replace(/Exception$/, '')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
        : 'Internal Server Error';
    const body: ApiErrorResponse = {
      statusCode: status,
      error: typeof details.error === 'string' ? details.error : exceptionName,
      message,
      path: request.originalUrl ?? request.url,
      timestamp: new Date().toISOString(),
      requestId: getRequestId(),
      code: typeof details.code === 'string' ? details.code : undefined,
      expectedVersion:
        typeof details.expectedVersion === 'number'
          ? details.expectedVersion
          : undefined,
      currentVersion:
        typeof details.currentVersion === 'number'
          ? details.currentVersion
          : undefined,
      issues: details.issues,
    };
    response.status(status).json(body);
  }
}
