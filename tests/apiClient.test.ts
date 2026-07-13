import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubGlobal('fetch', vi.fn());

// import.meta.env shim for node test environment
vi.stubEnv('VITE_API_URL', '');

const { request, ApiError } = await import('../src/lib/api');

const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => fetchMock.mockReset());

describe('api client', () => {
  it('unwraps ok envelope', async () => {
    fetchMock.mockResolvedValue({
      status: 200,
      json: async () => ({ ok: true, data: { hello: 'world' } }),
    });
    const data = await request<{ hello: string }>('/test');
    expect(data.hello).toBe('world');
  });

  it('throws ApiError with status on failure envelope', async () => {
    fetchMock.mockResolvedValue({
      status: 422,
      json: async () => ({ ok: false, error: 'clerkId: Required' }),
    });
    await expect(request('/test')).rejects.toThrowError(ApiError);
    await expect(request('/test')).rejects.toMatchObject({ status: 422, message: 'clerkId: Required' });
  });

  it('throws ApiError on non-json response', async () => {
    fetchMock.mockResolvedValue({
      status: 500,
      json: async () => {
        throw new Error('bad json');
      },
    });
    await expect(request('/test')).rejects.toMatchObject({ status: 500 });
  });
});
