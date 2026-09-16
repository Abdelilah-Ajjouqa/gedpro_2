import { BadRequestException } from '@nestjs/common';
import { DocumentSecurityService } from './document-security';

describe('DocumentSecurityService', () => {
  const service = new DocumentSecurityService();
  const file = (buffer: Buffer, mimetype = 'text/plain') =>
    ({ buffer, mimetype }) as Express.Multer.File;
  it('uses file signatures rather than browser MIME values', () => {
    const result = service.inspect(
      file(Buffer.from('%PDF-1.4 safe'), 'image/png'),
    );
    expect(result.mimeType).toBe('application/pdf');
    expect(result.checksum).toHaveLength(64);
  });
  it('rejects unknown content', () =>
    expect(() => service.inspect(file(Buffer.from('plain text')))).toThrow(
      BadRequestException,
    ));
  it('rejects the standard antivirus test signature', () =>
    expect(() =>
      service.inspect(
        file(Buffer.from('%PDF-EICAR-STANDARD-ANTIVIRUS-TEST-FILE')),
      ),
    ).toThrow('Malware scan rejected'));
});
