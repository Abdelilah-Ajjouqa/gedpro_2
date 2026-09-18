import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { Roles } from '../auth/decorator/auth.decorator';
import { RolesGuard } from '../auth/guard/auth.guard';
import { ApiProtected } from '../common/swagger/api-protected.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import {
  ReplaceDocumentDto,
  UploadDocumentDto,
} from './dto/upload-document.dto';
import { DocumentsService } from './documents.service';
const upload = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
@ApiTags('Documents')
@ApiProtected()
@Controller('documents')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}
  @Get()
  @Roles(Role.CANDIDATE, Role.RH, Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'List authorized active documents' })
  findAll(
    @Req() req: { user: User },
    @Query('candidateId') candidateId?: string,
    @Query('applicationId') applicationId?: string,
    @Query('includeArchived', new ParseBoolPipe({ optional: true }))
    includeArchived = false,
  ) {
    return this.service.findAll(
      req.user,
      candidateId ? +candidateId : undefined,
      applicationId ? +applicationId : undefined,
      includeArchived,
    );
  }
  @Post('upload')
  @Roles(Role.CANDIDATE, Role.RH, Role.MANAGER, Role.ADMIN)
  @UseInterceptors(upload)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Scan and upload a candidate or application document',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        candidateId: { type: 'integer' },
        applicationId: { type: 'integer' },
        category: { type: 'string' },
        retentionUntil: { type: 'string', format: 'date-time' },
      },
    },
  })
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @Req() req: { user: User },
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.service.create(file, req.user, dto);
  }
  @Post(':id/replace')
  @Roles(Role.CANDIDATE, Role.RH, Role.MANAGER, Role.ADMIN)
  @UseInterceptors(upload)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Archive the current version and upload a replacement',
  })
  replace(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ReplaceDocumentDto,
    @Req() req: { user: User },
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.service.replace(id, file, dto, req.user);
  }
  @Patch(':id/archive')
  @Roles(Role.CANDIDATE, Role.RH, Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Archive a document idempotently' })
  archive(@Param('id', ParseIntPipe) id: number, @Req() req: { user: User }) {
    return this.service.archive(id, req.user);
  }
  @Delete(':id')
  @Roles(Role.CANDIDATE, Role.RH, Role.MANAGER, Role.ADMIN)
  @ApiNoContentResponse()
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: User },
    @Res() res: Response,
  ) {
    await this.service.remove(id, req.user);
    res.status(204).send();
  }
  @Get(':id/download')
  @Roles(Role.CANDIDATE, Role.RH, Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Authorized download or inline preview' })
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Query('preview', new ParseBoolPipe({ optional: true })) preview: boolean,
    @Req() req: { user: User },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.download(id, req.user);
    res.set({
      'Content-Type': result.doc.mimeType,
      'Content-Length': result.length?.toString(),
      'Content-Disposition': `${preview ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(result.doc.originalName)}`,
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(result.stream);
  }
  @Get(':id/url')
  @Roles(Role.CANDIDATE, Role.RH, Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Create an expiring provider download URL' })
  url(@Param('id', ParseIntPipe) id: number, @Req() req: { user: User }) {
    return this.service.expiringUrl(id, req.user);
  }
  @Post('maintenance/retention')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Idempotently remove expired retained documents' })
  cleanup() {
    return this.service.cleanupExpired();
  }
  @Post('maintenance/orphans')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Report orphan-cleanup status' })
  orphans() {
    return this.service.cleanupOrphans();
  }
}

@ApiTags('Documents')
@Controller('document-download')
export class PublicDocumentDownloadController {
  constructor(private readonly service: DocumentsService) {}
  @Get(':id')
  @ApiOperation({ summary: 'Download using a short-lived signed URL' })
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Query('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.signedDownload(id, token);
    res.set({
      'Content-Type': result.doc.mimeType,
      'Content-Length': result.length?.toString(),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(result.doc.originalName)}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    });
    return new StreamableFile(result.stream);
  }
}
