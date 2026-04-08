import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase-admin', () => ({
  adminAuth: {
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'test-user-id' }),
  },
  adminDb: {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

describe('Guestlist Update API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require authorization', async () => {
    const { POST } = await import('../../app/api/guestlists/update/route');

    const req = new Request('http://localhost/api/guestlists/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestlistId: 'gl-1', data: { name: 'Updated' } }),
    });

    const response = await POST(req as any);
    expect(response.status).toBe(401);
  });

  it('should require guestlistId and data', async () => {
    const { POST } = await import('../../app/api/guestlists/update/route');

    const req = new Request('http://localhost/api/guestlists/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(req as any);
    expect(response.status).toBe(400);
  });

  it('should update successfully with valid data', async () => {
    const { POST } = await import('../../app/api/guestlists/update/route');

    const req = new Request('http://localhost/api/guestlists/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({ guestlistId: 'gl-1', data: { name: 'Updated Guestlist' } }),
    });

    const response = await POST(req as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe('Guestlist Delete API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require authorization', async () => {
    const { POST } = await import('../../app/api/guestlists/delete/route');

    const req = new Request('http://localhost/api/guestlists/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestlistId: 'gl-1' }),
    });

    const response = await POST(req as any);
    expect(response.status).toBe(401);
  });

  it('should require guestlistId', async () => {
    const { POST } = await import('../../app/api/guestlists/delete/route');

    const req = new Request('http://localhost/api/guestlists/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(req as any);
    expect(response.status).toBe(400);
  });

  it('should delete successfully with valid guestlistId', async () => {
    const { POST } = await import('../../app/api/guestlists/delete/route');

    const req = new Request('http://localhost/api/guestlists/delete', {
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
  });
});
