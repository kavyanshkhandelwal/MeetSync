import { describe, expect, it } from 'vitest';
import {
  REMINDER_JOB_NAME,
  REMINDER_JOB_OPTIONS,
  reminderJobId,
} from '../../../src/queues/reminder.queue';

describe('reminder queue contract (unit)', () => {
  it('uses the booking id as a stable job id', () => {
    expect(reminderJobId('booking-1')).toBe('booking-1');
  });

  it('retries failed jobs three times and keeps failures for inspection', () => {
    expect(REMINDER_JOB_NAME).toBe('reminder');
    expect(REMINDER_JOB_OPTIONS.attempts).toBe(3);
    expect(REMINDER_JOB_OPTIONS.backoff).toEqual({ type: 'exponential', delay: 1000 });
    expect(REMINDER_JOB_OPTIONS.removeOnComplete).toBe(true);
    expect(REMINDER_JOB_OPTIONS.removeOnFail).toBe(false);
  });
});
