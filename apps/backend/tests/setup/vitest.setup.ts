process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-suite';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
process.env.REMINDER_QUEUE_NAME = process.env.REMINDER_QUEUE_NAME || 'booking-reminders-test';
process.env.MAIL_HOST = '';
