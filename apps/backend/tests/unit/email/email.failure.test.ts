import { afterEach, describe, expect, it } from 'vitest';
import nodemailer from 'nodemailer';
import { emailService } from '../../../src/services/email.service';

describe('email transport failure', () => {
  const original = (emailService as any).transport;

  afterEach(() => {
    emailService.setTransport(original);
  });

  it('does not record an outbox message when sendMail fails', async () => {
    emailService.clearOutbox();
    emailService.setTransport({
      sendMail: async () => {
        throw new Error('SMTP connection refused');
      },
    } as any);

    await expect(
      emailService.sendBookingReminder('ada@company.com', {
        bookingId: 'b-fail',
        purpose: 'Failure case',
        startTime: new Date('2030-01-01T10:00:00.000Z'),
        endTime: new Date('2030-01-01T11:00:00.000Z'),
        roomName: 'Orion',
        status: 'PENDING',
      }),
    ).rejects.toThrow(/SMTP connection refused/);

    expect(emailService.getOutbox().some((m) => m.subject.includes('Failure case'))).toBe(false);
  });

  it('records the outbox only after the test transport accepts the message', async () => {
    emailService.clearOutbox();
    emailService.setTransport(nodemailer.createTransport({ jsonTransport: true }));
    await emailService.sendBookingConfirmation('ada@company.com', {
      bookingId: 'b-ok',
      purpose: 'Accepted',
      startTime: new Date('2030-01-01T10:00:00.000Z'),
      endTime: new Date('2030-01-01T11:00:00.000Z'),
      roomName: 'Orion',
      status: 'PENDING',
    });
    const accepted = emailService.getOutbox().filter((m) => m.to === 'ada@company.com');
    expect(accepted.length).toBeGreaterThan(0);
    expect(accepted[0].html).toContain('Orion');
    expect(accepted[0].text).toContain('10:00');
  });
});
