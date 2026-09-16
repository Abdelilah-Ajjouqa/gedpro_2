import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

export interface EmailProvider {
  send(message: {
    to: string;
    subject: string;
    html: string;
    idempotencyKey: string;
  }): Promise<{ messageId: string }>;
}
export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');
@Injectable()
export class LogEmailProvider implements EmailProvider {
  async send(message: {
    to: string;
    subject: string;
    html: string;
    idempotencyKey: string;
  }) {
    // Intentionally do not log bodies: they can contain reset tokens or PII.
    return {
      messageId: `log-${createHash('sha256').update(message.idempotencyKey).digest('hex')}`,
    };
  }
}
