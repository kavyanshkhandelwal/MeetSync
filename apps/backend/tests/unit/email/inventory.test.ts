import { describe, expect, it } from 'vitest';
import {
  moduleExists,
  readBackendPackage,
  sourceMentions,
} from '../../helpers/email.probe';

describe('Email / BullMQ inventory (unit)', () => {
  it('nodemailer is a declared dependency', () => {
    const pkg = readBackendPackage();
    expect(pkg.dependencies.nodemailer).toBeTruthy();
  });

  it('nodemailer is imported from application source', () => {
    const hits = sourceMentions(/from ['"]nodemailer['"]|require\(['"]nodemailer['"]\)/);
    expect(hits.length).toBeGreaterThan(0);
  });

  it('bullmq is a dependency', () => {
    const pkg = readBackendPackage();
    expect(pkg.dependencies.bullmq || pkg.devDependencies?.bullmq).toBeTruthy();
  });

  it('ioredis is a dependency', () => {
    const pkg = readBackendPackage();
    expect(pkg.dependencies.ioredis || pkg.devDependencies?.ioredis).toBeTruthy();
  });

  it('email and reminder modules exist', () => {
    expect(moduleExists('services/email.service.ts')).toBe(true);
    expect(moduleExists('services/reminder.service.ts')).toBe(true);
    expect(moduleExists('queues/reminder.queue.ts')).toBe(true);
    expect(moduleExists('workers/reminder.worker.ts')).toBe(true);
    expect(moduleExists('templates/booking-confirmation.ts')).toBe(true);
    expect(moduleExists('templates/booking-reminder.ts')).toBe(true);
    expect(moduleExists('templates/booking-cancellation.ts')).toBe(true);
  });

  it('API bootstrap does not start the reminder worker', () => {
    const indexHits = sourceMentions(/startReminderWorker/);
    expect(indexHits).not.toContain('index.ts');
    const pkg = readBackendPackage();
    expect(pkg.scripts.worker).toMatch(/reminder\.worker/);
  });
});
