import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-admin
vi.mock('@/lib/firebase-admin', () => ({
  adminAuth: {
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'test-user-id' }),
  },
  adminDb: {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            name: 'Test Guestlist',
            eventName: 'Test Event',
            communityId: 'comm-1',
            members: [
              { id: 'm1', userId: 'u1', name: 'Alice', email: 'alice@test.com', status: 'invited' },
              { id: 'm2', userId: 'u2', name: 'Bob', email: 'bob@test.com', status: 'invited' },
              { id: 'm3', userId: 'u3', name: 'Charlie', status: 'invited' }, // no email
            ],
          }),
        }),
        set: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

// Mock crypto
vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn().mockReturnValue({
      toString: () => 'mock-token-123',
    }),
  },
  randomBytes: vi.fn().mockReturnValue({
    toString: () => 'mock-token-123',
  }),
}));

// Mock global fetch for Resend API
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RSVP Send API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:9003';

    // Mock Resend API success
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'email-123' }),
    });
  });

  it('should require authorization header', async () => {
    const { POST } = await import('../../app/api/rsvp/send/route');

    const req = new Request('http://localhost/api/rsvp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestlistId: 'gl-1' }),
    });

    const response = await POST(req as any);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should require guestlistId', async () => {
    const { POST } = await import('../../app/api/rsvp/send/route');

    const req = new Request('http://localhost/api/rsvp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(req as any);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('guestlistId is required');
  });

  it('should return success with sent count', async () => {
    const { POST } = await import('../../app/api/rsvp/send/route');

    const req = new Request('http://localhost/api/rsvp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        guestlistId: 'gl-1',
        guestlistName: 'Test Guestlist',
        eventName: 'Test Event',
        communityId: 'comm-1',
      }),
    });

    const response = await POST(req as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
