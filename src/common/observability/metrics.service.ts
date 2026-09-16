import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private readonly requests = new Map<string, number>();
  private readonly durations = new Map<
    string,
    { count: number; sum: number }
  >();

  observe(method: string, route: string, status: number, seconds: number) {
    const labels = `${method}|${route}|${status}`;
    this.requests.set(labels, (this.requests.get(labels) ?? 0) + 1);
    const duration = this.durations.get(labels) ?? { count: 0, sum: 0 };
    duration.count++;
    duration.sum += seconds;
    this.durations.set(labels, duration);
  }

  render() {
    const lines = [
      '# HELP gedpro_http_requests_total Total HTTP requests.',
      '# TYPE gedpro_http_requests_total counter',
    ];
    for (const [key, count] of this.requests) {
      const [method, route, status] = key.split('|');
      const labels = `method="${method}",route="${route}",status="${status}"`;
      lines.push(`gedpro_http_requests_total{${labels}} ${count}`);
    }
    lines.push(
      '# HELP gedpro_http_request_duration_seconds HTTP request duration.',
      '# TYPE gedpro_http_request_duration_seconds summary',
    );
    for (const [key, value] of this.durations) {
      const [method, route, status] = key.split('|');
      const labels = `method="${method}",route="${route}",status="${status}"`;
      lines.push(
        `gedpro_http_request_duration_seconds_count{${labels}} ${value.count}`,
        `gedpro_http_request_duration_seconds_sum{${labels}} ${value.sum.toFixed(6)}`,
      );
    }
    return `${lines.join('\n')}\n`;
  }
}
