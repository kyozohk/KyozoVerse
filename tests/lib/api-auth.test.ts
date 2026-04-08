import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase admin
const mockVerifyIdToken = vi.fn();
vi.mock('@/firebase/admin', () => ({
  auth: {
    verifyIdToken: mockVerifyIdToken,
  },
}));

describe('verifyAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject requests without Authorization header', async () => {
    const { verifyAuth } = await import('../../src/lib/api-auth');

    const req = new Request('http://localhost/api/test', {
      method: 'GET',
    });

    const result = await verifyAuth(req as any);
    expect(result.error).toBeDefined();
    expect(result.uid).toBeUndefined();
  });

  it('should reject requests with invalid Authorization format', async () => {
    const { verifyAuth } = await import('../../src/lib/api-auth');

    const req = new Request('http://localhost/api/test', {
      method: 'GET',
      headers: { 'Authorization': 'InvalidFormat token123' },
    });

    const result = await verifyAuth(req as any);
    expect(result.error).toBeDefined();
  });

  it('should return uid for valid token', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: 'user-123' });
    const { verifyAuth } = await import('../../src/lib/api-auth');

    const req = new Request('http://localhost/api/test', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer valid-token' },
    });

    const result = await verifyAuth(req as any);
    expect(result.uid).toBe('user-123');
    expect(result.error).toBeUndefined();
  });

  it('should handle token verification failure', async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error('Token expired'));
    const { verifyAuth } = await import('../../src/lib/api-auth');

    const req = new Request('http://localhost/api/test', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer expired-token' },
    });

    const result = await verifyAuth(req as any);
    expect(result.error).toBeDefined();
  });
});

describe('checkRateLimit', () => {
  it('should allow requests within rate limit', async () => {
    const { checkRateLimit } = await import('../../src/lib/api-auth');

    const req = new Request('http://localhost/api/test', {
      method: 'GET',
      headers: { 'x-forwarded-for': '192.168.1.1' },
    });

    const result = checkRateLimit(req as any, 10, 60000);
    expect(result).toBeNull();
  });
});
