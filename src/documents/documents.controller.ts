import {
    Controller, Post, UseInterceptors, UploadedFile, UseGuards, Req, ParseFilePipe, MaxFileSizeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PermissionsGuard } from '../auth/guard/auth.guard';
import { PermissionDecorator } from '../auth/decorator/auth.decorator';
import { User } from '../users/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { CustomFileTypeValidator } from './validator/file-type.validator';

@Controller('documents')
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) {}

    @Post('upload')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @PermissionDecorator('documents:upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            },
        }),
    }))
    async uploadFile(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), 
                    new CustomFileTypeValidator({}) 
                ],
            }),
        ) file: Express.Multer.File,
        @Req() req: any,
    ) {
        return this.documentsService.create(file, req.user as User);
    }
}