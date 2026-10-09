import { describe, expect, it } from 'vitest';
import { createEmailTransport } from '../../../src/services/email.service';

describe('createEmailTransport', () => {
  it('uses jsonTransport in test even when MAIL_HOST is set', () => {
    const transport = createEmailTransport({
      nodeEnv: 'test',
      mailHost: 'smtp.example.com',
      mailPort: 587,
      mailUser: 'user',
      mailPassword: 'secret',
    });
    expect(transport.transporter.name).toBe('JSONTransport');
  });

  it('uses jsonTransport when MAIL_HOST is empty', () => {
    const transport = createEmailTransport({
      nodeEnv: 'production',
      mailHost: '',
      mailPort: 587,
      mailUser: '',
      mailPassword: '',
    });
    expect(transport.transporter.name).toBe('JSONTransport');
  });

  it('uses SMTP when MAIL_HOST is set outside test', () => {
    const transport = createEmailTransport({
      nodeEnv: 'production',
      mailHost: 'smtp.example.com',
      mailPort: 587,
      mailUser: 'user',
      mailPassword: 'secret',
    });
    expect(transport.transporter.name).toBe('SMTP');
  });
});
