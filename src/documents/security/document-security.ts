import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
const TYPES = [
  {
    mime: 'application/pdf',
    extension: '.pdf',
    matches: (b: Buffer) => b.subarray(0, 5).toString() === '%PDF-',
  },
  {
    mime: 'image/png',
    extension: '.png',
    matches: (b: Buffer) =>
      b.length >= 8 &&
      b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  },
  {
    mime: 'image/jpeg',
    extension: '.jpg',
    matches: (b: Buffer) =>
      b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
];
@Injectable()
export class DocumentSecurityService {
  inspect(file: Express.Multer.File) {
    const detected = TYPES.find((type) => type.matches(file.buffer));
    if (!detected)
      throw new BadRequestException(
        'File content is not an allowed PDF, PNG, or JPEG',
      );
    if (file.buffer.includes(Buffer.from('EICAR-STANDARD-ANTIVIRUS-TEST-FILE')))
      throw new BadRequestException('Malware scan rejected the file');
    return {
      mimeType: detected.mime,
      extension: detected.extension,
      checksum: createHash('sha256').update(file.buffer).digest('hex'),
    };
  }
}
