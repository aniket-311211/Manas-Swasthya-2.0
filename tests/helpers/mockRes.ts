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
  /** Needed to exercise auth: handlers read the Authorization header. */
  headers?: Record<string, string>;
  /**
   * Send no Authorization header even though a clerkId is present, to exercise
   * the anonymous path.
   */
  auth?: false;
}): VercelRequest {
  const fromBody = (init.body as { clerkId?: unknown } | undefined)?.clerkId;
  const clerkId = typeof fromBody === 'string' ? fromBody : init.query?.clerkId;

  /*
   * Endpoints take identity from a verified Clerk token now, not from a
   * `clerkId` in the body. Tests still name the caller that way because it
   * reads clearly, so the header is minted from it here — `tests/setup/clerk.ts`
   * stubs Clerk's signature check to accept `test:<clerkId>` and reject
   * everything else.
   *
   * An explicit `headers.authorization` always wins: that is how a test signs
   * in as a mentor, who has a different kind of token.
   */
  const signed =
    init.auth !== false && clerkId && !init.headers?.authorization
      ? { authorization: `Bearer test:${clerkId}` }
      : {};

  return {
    method: init.method,
    headers: { ...signed, ...(init.headers ?? {}) },
    body: init.body ?? {},
    query: init.query ?? {},
  } as unknown as VercelRequest;
}
