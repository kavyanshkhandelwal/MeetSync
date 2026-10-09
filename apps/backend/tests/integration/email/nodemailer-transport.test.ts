import { describe, expect, it } from 'vitest';
import nodemailer from 'nodemailer';
import { emailService } from '../../../src/services/email.service';

describe('Nodemailer test transport', () => {
  it('can construct a local json test transport', async () => {
    const transport = nodemailer.createTransport({ jsonTransport: true });
    const info = await transport.sendMail({
      from: 'test@local',
      to: 'user@local',
      subject: 'probe',
      text: 'probe body',
    });
    expect(info.message).toBeTruthy();
    const parsed = JSON.parse(info.message as string);
    expect(parsed.subject).toBe('probe');
  });

  it('email service sends a confirmation through the default transport', async () => {
    await emailService.sendBookingConfirmation('user@local', {
      bookingId: 'b1',
      purpose: 'Probe',
      startTime: new Date('2030-01-01T10:00:00.000Z'),
    });
    expect(emailService.getOutbox().some((m) => m.subject.includes('Booking confirmed'))).toBe(true);
  });
});
