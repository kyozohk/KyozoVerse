import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-admin
const mockGet = vi.fn();
const mockUpdate = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: mockGet,
        update: mockUpdate,
      }),
    }),
  },
  adminAuth: {
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'test-user' }),
  },
}));

describe('RSVP Accept API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require a token', async () => {
    const { POST } = await import('../../app/api/rsvp/accept/route');

    const req = new Request('http://localhost/api/rsvp/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(req as any);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('Token is required');
  });

  it('should return 404 for invalid token', async () => {
    mockGet.mockResolvedValueOnce({ exists: false });

    const { POST } = await import('../../app/api/rsvp/accept/route');

    const req = new Request('http://localhost/api/rsvp/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid-token' }),
    });

    const response = await POST(req as any);
    expect(response.status).toBe(404);
  });

  it('should handle already-accepted tokens', async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        status: 'accepted',
        memberName: 'Alice',
        guestlistId: 'gl-1',
        memberId: 'm1',
        memberUserId: 'u1',
      }),
    });

    const { POST } = await import('../../app/api/rsvp/accept/route');

    const req = new Request('http://localhost/api/rsvp/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'already-used-token' }),
    });

    const response = await POST(req as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.alreadyAccepted).toBe(true);
  });

  it('should successfully accept a valid token', async () => {
    // First call for token doc
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        status: 'pending',
        memberName: 'Bob',
        guestlistId: 'gl-1',
        memberId: 'm2',
        memberUserId: 'u2',
        expiresAt: { toDate: () => new Date(Date.now() + 86400000) },
      }),
    });
    // Second call for guestlist doc
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        members: [
          { id: 'm1', userId: 'u1', name: 'Alice', rsvpStatus: 'accepted' },
          { id: 'm2', userId: 'u2', name: 'Bob', rsvpStatus: 'pending' },
        ],
      }),
    });

    const { POST } = await import('../../app/api/rsvp/accept/route');

    const req = new Request('http://localhost/api/rsvp/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token' }),
    });

    const response = await POST(req as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.memberName).toBe('Bob');
  });
});
