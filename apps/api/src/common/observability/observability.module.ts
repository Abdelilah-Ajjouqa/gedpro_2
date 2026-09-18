import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { ObservabilityController } from './observability.controller';

@Module({
  controllers: [ObservabilityController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class ObservabilityModule {}
