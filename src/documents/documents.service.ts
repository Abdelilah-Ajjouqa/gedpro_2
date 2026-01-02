import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class DocumentsService {
    constructor(
        @InjectRepository(Document)
        private documentRepository: Repository<Document>,
    ) {}

    async create(file: Express.Multer.File, user: User) {
        const newDoc = this.documentRepository.create({
            originalName: file.originalname,
            filename: file.filename,
            mimeType: file.mimetype,
            size: file.size,
            path: file.path,
            user: user,
        });

        return await this.documentRepository.save(newDoc);
    }
}