import { describe, it, expect, vi, beforeEach } from 'vitest';

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
            members: [
              { id: 'm1', userId: 'u1', name: 'Alice', email: 'alice@test.com', rsvpStatus: 'pending', rsvpToken: 'token-1' },
              { id: 'm2', userId: 'u2', name: 'Bob', email: 'bob@test.com', rsvpStatus: 'accepted', rsvpToken: 'token-2' },
              { id: 'm3', userId: 'u3', name: 'Charlie', email: 'charlie@test.com', rsvpStatus: 'pending', rsvpToken: 'token-3' },
            ],
          }),
        }),
        update: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RSVP Remind API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:9003';

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'email-123' }),
    });
  });

  it('should require authorization', async () => {
    const { POST } = await import('../../app/api/rsvp/remind/route');

    const req = new Request('http://localhost/api/rsvp/remind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestlistId: 'gl-1' }),
    });

    const response = await POST(req as any);
    expect(response.status).toBe(401);
  });

  it('should require guestlistId', async () => {
    const { POST } = await import('../../app/api/rsvp/remind/route');

    const req = new Request('http://localhost/api/rsvp/remind', {
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

  it('should only send reminders to pending members', async () => {
    const { POST } = await import('../../app/api/rsvp/remind/route');

    const req = new Request('http://localhost/api/rsvp/remind', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({ guestlistId: 'gl-1' }),
    });

    const response = await POST(req as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Should remind 2 pending members (Alice and Charlie), not Bob (accepted)
    expect(data.totalReminded).toBe(2);
  });
});
