import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  ParseFilePipe,
  MaxFileSizeValidator,
  Get,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { RolesGuard } from '../auth/guard/auth.guard';
import { Roles } from '../auth/decorator/auth.decorator';
import { User } from '../users/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { CustomFileTypeValidator } from './validator/file-type.validator';
import { Role } from '../users/enums/role.enum';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiProtected } from '../common/swagger/api-protected.decorator';
import { UploadDocumentDto } from './dto/upload-document.dto';

@ApiTags('Documents')
@ApiProtected()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'List documents owned by the authenticated user' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.CANDIDATE, Role.ADMIN)
  async findAll(@Req() req: any) {
    return this.documentsService.findAll(req.user as User);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF, JPG, or PNG; maximum 5 MiB',
        },
        candidateId: {
          type: 'integer',
          description: 'Optional candidate timeline association',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Document metadata stored successfully' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.CANDIDATE, Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.UPLOAD_DIR ?? 'uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new CustomFileTypeValidator({}),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @Req() req: any,
  ) {
    return this.documentsService.create(
      file,
      req.user as User,
      dto.candidateId,
    );
  }
}
