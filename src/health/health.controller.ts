import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiTags } from '@nestjs/swagger';
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
  health() {
    return { status: 'ok' };
  }

  @Get('ready')
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
      throw new ServiceUnavailableException('A required database is unavailable');
    }
  }
}
