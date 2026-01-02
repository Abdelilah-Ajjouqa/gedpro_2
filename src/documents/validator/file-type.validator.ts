import { FileValidator, Injectable } from '@nestjs/common';

@Injectable()
export class CustomFileTypeValidator extends FileValidator {
    isValid(file: any): boolean {
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/jpg',
            'application/pdf'
        ];

        console.log(`[File Upload] Detected MimeType: ${file.mimetype}`);
        return allowedMimeTypes.includes(file.mimetype);
    }

    buildErrorMessage(file: any): string {
        return `Upload Failed. Type '${file.mimetype}' is not allowed. Expected: PDF, JPG, or PNG.`;
    }
}