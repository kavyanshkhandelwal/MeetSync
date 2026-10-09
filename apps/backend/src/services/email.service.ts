import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config';
import { logger } from '../utils/logger';
import { formatBookingSchedule } from '../templates/formatBookingTime';
import {
  bookingCancellationMail,
  bookingConfirmationMail,
  bookingReminderMail,
} from '../templates/bookingMail';

export type OutboxMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  sentAt: string;
  messageId?: string;
};

const outbox: OutboxMessage[] = [];

export type BookingMailInput = {
  bookingId: string;
  purpose: string;
  startTime: Date;
  endTime?: Date;
  roomName?: string;
  status?: string;
};

export function createEmailTransport(options: {
  nodeEnv: string;
  mailHost: string;
  mailPort: number;
  mailUser: string;
  mailPassword: string;
}): Transporter {
  if (options.nodeEnv === 'test' || !options.mailHost) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    host: options.mailHost,
    port: options.mailPort,
    secure: options.mailPort === 465,
    auth: options.mailUser
      ? { user: options.mailUser, pass: options.mailPassword }
      : undefined,
  });
}

function mailFields(booking: BookingMailInput) {
  const schedule = formatBookingSchedule(
    new Date(booking.startTime),
    booking.endTime ? new Date(booking.endTime) : undefined,
    env.MAIL_TIMEZONE,
  );
  return {
    bookingId: booking.bookingId,
    purpose: booking.purpose,
    roomName: booking.roomName || 'Conference room',
    status: booking.status || 'PENDING',
    date: schedule.date,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    timeZone: schedule.timeZone,
  };
}

class EmailService {
  private transport: Transporter;

  constructor() {
    this.transport = createEmailTransport({
      nodeEnv: env.NODE_ENV,
      mailHost: env.MAIL_HOST,
      mailPort: env.MAIL_PORT,
      mailUser: env.MAIL_USER,
      mailPassword: env.MAIL_PASSWORD,
    });
  }

  setTransport(transport: Transporter): void {
    this.transport = transport;
  }

  getOutbox(): OutboxMessage[] {
    return [...outbox];
  }

  clearOutbox(): void {
    outbox.length = 0;
  }

  async sendBookingConfirmation(to: string, booking: BookingMailInput): Promise<void> {
    const mail = bookingConfirmationMail(mailFields(booking));
    await this.send(to, mail.subject, mail.text, mail.html);
  }

  async sendBookingReminder(to: string, booking: BookingMailInput): Promise<void> {
    const mail = bookingReminderMail(mailFields(booking));
    await this.send(to, mail.subject, mail.text, mail.html);
  }

  async sendCancellation(to: string, booking: BookingMailInput): Promise<void> {
    const mail = bookingCancellationMail(mailFields({ ...booking, status: booking.status || 'CANCELLED' }));
    await this.send(to, mail.subject, mail.text, mail.html);
  }

  private async send(to: string, subject: string, text: string, html: string): Promise<void> {
    if (!to || to === 'unknown@local') {
      throw new Error('Cannot send email: recipient address is missing');
    }

    const info = await this.transport.sendMail({
      from: env.MAIL_FROM,
      to,
      subject,
      text,
      html,
    });

    outbox.push({
      to,
      subject,
      text,
      html,
      sentAt: new Date().toISOString(),
      messageId: info.messageId,
    });
    logger.info(`Email transport accepted: ${subject} → ${to} (${info.messageId || 'json'})`);
  }
}

export const emailService = new EmailService();
