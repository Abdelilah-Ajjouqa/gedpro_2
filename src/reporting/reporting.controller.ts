import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '../auth/decorator/auth.decorator';
import { RolesGuard } from '../auth/guard/auth.guard';
import { ApiProtected } from '../common/swagger/api-protected.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { CreateReportExportDto, ReportQueryDto } from './dto/reporting.dto';
import { ReportExportFormat } from './entities/report-export.entity';
import { ReportingService } from './reporting.service';

@ApiTags('Reporting')
@ApiProtected()
@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.RH, Role.MANAGER)
export class ReportingController {
  constructor(private reports: ReportingService) {}
  @Get('summary')
  @ApiOperation({
    summary:
      'Hiring funnel, velocity, source, workload, and job metrics using [from,to) UTC boundaries',
  })
  summary(@Query() q: ReportQueryDto, @Req() req: { user: User }) {
    return this.reports.summary(q, req.user);
  }
  @Post('exports')
  @ApiOperation({
    summary: 'Queue an asynchronous role-scoped CSV or Excel export',
  })
  create(@Body() dto: CreateReportExportDto, @Req() req: { user: User }) {
    return this.reports.createExport(dto, req.user);
  }
  @Get('exports') list(@Req() req: { user: User }) {
    return this.reports.listExports(req.user);
  }
  @Get('exports/:id') get(@Param('id') id: string, @Req() req: { user: User }) {
    return this.reports.getExport(id, req.user);
  }
  @Get('exports/:id/download')
  @ApiOperation({ summary: 'Download a completed export before expiry' })
  async download(
    @Param('id') id: string,
    @Req() req: { user: User },
    @Res() res: Response,
  ) {
    const { row, data } = await this.reports.download(id, req.user);
    res.type(
      row.format === ReportExportFormat.CSV
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.attachment(`gedpro-report-${row.id}.${row.format}`);
    res.send(data);
  }
}
