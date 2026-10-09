// Must be imported before SocketService.init() so CORS origin matches the test client.
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
