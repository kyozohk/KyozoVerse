/**
 * GET /api/v1/connectors
 *
 * Returns the connector catalog with each provider's status (available /
 * coming_soon / connected) for the caller's workspace. The UI uses this to
 * render the integration cards on the /onboard/integrate step.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireWorkspace } from '@/lib/v2/workspace';
import { PROVIDERS, listSourceConnections } from '@/lib/v2/connectors';

export async function GET(request: NextRequest) {
  const ws = await requireWorkspace(request);
  if (!ws.ok) return ws.response;
  const { workspaceId } = ws.ctx;

  const connected = await listSourceConnections(workspaceId);
  const connectedSet = new Set(connected.map((c) => c.provider));

  const providers = Object.values(PROVIDERS).map((p) => ({
    provider: p.provider,
    label: p.label,
    blurb: p.blurb,
    status: p.status,
    connected: connectedSet.has(p.provider),
  }));

  return NextResponse.json({ providers });
}
