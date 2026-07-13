import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ZodSchema } from 'zod';

export function ok(res: VercelResponse, data: unknown, status = 200): void {
  res.status(status).json({ ok: true, data });
}

export function fail(res: VercelResponse, message: string, status = 400): void {
  res.status(status).json({ ok: false, error: message });
}

export function parseBody<T>(req: VercelRequest, res: VercelResponse, schema: ZodSchema<T>): T | null {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    fail(res, result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '), 422);
    return null;
  }
  return result.data;
}

export function methodGuard(req: VercelRequest, res: VercelResponse, methods: string[]): boolean {
  if (!methods.includes(req.method ?? '')) {
    fail(res, `Method ${req.method} not allowed`, 405);
    return false;
  }
  return true;
}

export function queryStr(req: VercelRequest, key: string): string | undefined {
  const v = req.query[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

export async function withErrors(res: VercelResponse, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.error(err);
    fail(res, err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
