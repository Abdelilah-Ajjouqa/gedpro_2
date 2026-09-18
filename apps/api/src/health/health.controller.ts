import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../common/swagger/api-error.dto';
import { Connection } from 'mongoose';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check whether the API process is alive' })
  @ApiOkResponse({ schema: { example: { status: 'ok' } } })
  health() {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check PostgreSQL and MongoDB readiness' })
  @ApiOkResponse({
    schema: { example: { status: 'ready', postgres: 'up', mongodb: 'up' } },
  })
  @ApiServiceUnavailableResponse({ type: ApiErrorDto })
  async readiness() {
    try {
      if (!this.mongoConnection.db) {
        throw new Error('MongoDB connection is not initialized');
      }
      await Promise.all([
        this.dataSource.query('SELECT 1'),
        this.mongoConnection.db.admin().ping(),
      ]);
      return { status: 'ready', postgres: 'up', mongodb: 'up' };
    } catch {
      throw new ServiceUnavailableException(
        'A required database is unavailable',
      );
    }
  }
}
