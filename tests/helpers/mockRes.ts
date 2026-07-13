import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface Captured {
  statusCode: number;
  body: unknown;
}

export function mockRes(): { res: VercelResponse; captured: Captured } {
  const captured: Captured = { statusCode: 200, body: undefined };
  const res = {
    status(code: number) {
      captured.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      captured.body = payload;
      return this;
    },
  } as unknown as VercelResponse;
  return { res, captured };
}

export function mockReq(init: {
  method: string;
  body?: unknown;
  query?: Record<string, string>;
}): VercelRequest {
  return {
    method: init.method,
    body: init.body ?? {},
    query: init.query ?? {},
    headers: {},
  } as unknown as VercelRequest;
}
