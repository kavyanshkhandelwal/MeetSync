import type { NextFunction, Request, Response } from 'express';

export function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides,
  } as Request;
}

export function mockResponse(): Response & {
  statusCode: number;
  body: unknown;
} {
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  return res;
}

export function mockNext(): NextFunction & { error?: unknown } {
  const next: any = (err?: unknown) => {
    next.error = err;
  };
  return next;
}
