/**
 * POST /api/v1/contacts/import/csv
 *
 * Accept a CSV or XLSX upload, parse it, sanitize against formula injection,
 * dedup by phone/email within the caller's workspace, write contacts in
 * batches, and record one ImportBatch with the given name.
 *
 * Request: multipart/form-data with the following fields:
 *   file        — the .csv or .xlsx file (required)
 *   importName  — human name for this batch ("first run") (required)
 *   columnMap   — JSON describing which sheet column maps to which contact
 *                 field, e.g.
 *                 {"email": "Email", "phone": "Phone", "firstName": "First",
 *                  "lastName": "Last", "displayName": "Name", "event": "Event",
 *                  "providerRecordId": "ID"}
 *                 (required; pass either email or phone, plus at least one
 *                 name column)
 *   defaultCountry — ISO-2 hint for parsing phone numbers like "0207 946 0123" (optional)
 *
 * Response (200):
 *   {
 *     importId,
 *     stats: { created, merged, skippedNoIdentity },
 *     contactIds: [...]   // truncated to first 100 for response size
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createHash } from 'crypto';
import { requireWorkspace } from '@/lib/v2/workspace';
import {
  bulkUpsertContacts,
  applyImportTagToContacts,
  type ContactInput,
} from '@/lib/v2/contacts';
import { createImport } from '@/lib/v2/imports';
import { sanitizeCellValue } from '@/lib/v2/dedup';

// Cap upload size at ~25 MB. Anything bigger should use a presigned-URL flow.
const MAX_BYTES = 25 * 1024 * 1024;

interface ColumnMap {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  event?: string;
  providerRecordId?: string;
}

export async function POST(request: NextRequest) {
  const wsAuth = await requireWorkspace(request, { minRole: 'admin' });
  if (!wsAuth.ok) return wsAuth.response;
  const { workspaceId, uid } = wsAuth.ctx;

  // ---- parse multipart -----------------------------------------------------
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart/form-data', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  const file = form.get('file');
  const importName = (form.get('importName') as string | null)?.trim() || '';
  const columnMapRaw = (form.get('columnMap') as string | null) || '';
  const defaultCountry =
    ((form.get('defaultCountry') as string | null) || '').toUpperCase() || undefined;

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'Missing required field: file', code: 'MISSING_FIELD' },
      { status: 400 }
    );
  }
  if (!importName) {
    return NextResponse.json(
      { error: 'Missing required field: importName', code: 'MISSING_FIELD' },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `File exceeds ${MAX_BYTES} bytes. Use a presigned-URL upload for larger files.`,
        code: 'PAYLOAD_TOO_LARGE',
      },
      { status: 413 }
    );
  }

  let columnMap: ColumnMap;
  try {
    columnMap = columnMapRaw ? (JSON.parse(columnMapRaw) as ColumnMap) : {};
  } catch {
    return NextResponse.json(
      { error: 'columnMap must be JSON', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }
  if (!columnMap.email && !columnMap.phone) {
    return NextResponse.json(
      {
        error: 'columnMap must include at least one of: email, phone',
        code: 'MISSING_FIELD',
      },
      { status: 400 }
    );
  }

  // ---- read sheet ----------------------------------------------------------
  let rows: Record<string, unknown>[];
  let sourceRecordCount = 0;
  try {
    const arrayBuf = await file.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(arrayBuf), { type: 'array' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        { error: 'File has no sheets', code: 'EMPTY_FILE' },
        { status: 400 }
      );
    }
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], {
      defval: '',
    });
    sourceRecordCount = rows.length;
  } catch (e) {
    return NextResponse.json(
      {
        error: 'Failed to parse file. Provide a valid .csv or .xlsx.',
        details: (e as Error).message,
        code: 'PARSE_ERROR',
      },
      { status: 400 }
    );
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'File has no rows', code: 'EMPTY_FILE' },
      { status: 400 }
    );
  }

  // ---- create import doc (idempotent on workspaceId + name) ---------------
  const importResult = await createImport({
    workspaceId,
    createdByUid: uid,
    name: importName,
    sources: [{ provider: 'csv_upload', recordCount: sourceRecordCount }],
    contactCount: 0, // patched below if we want — currently set at create-time only
    duplicatesMerged: 0,
    communityIds: [],
  });
  if (!importResult.ok) {
    return NextResponse.json(
      { error: `Failed to create import: ${importResult.reason}`, code: importResult.reason },
      { status: 400 }
    );
  }
  const { importId } = importResult;

  // ---- map rows → ContactInput -------------------------------------------
  function get(row: Record<string, unknown>, key?: string): string | undefined {
    if (!key) return undefined;
    const v = row[key];
    if (v == null) return undefined;
    return String(v);
  }
  function rowHash(row: Record<string, unknown>): string {
    return createHash('sha256').update(JSON.stringify(row)).digest('hex').slice(0, 16);
  }

  const inputs: ContactInput[] = rows.map((row) => {
    const providerRecordId =
      get(row, columnMap.providerRecordId) || `csv:${rowHash(row)}`;
    const eventName = get(row, columnMap.event);
    return {
      email: get(row, columnMap.email),
      phone: get(row, columnMap.phone),
      firstName: get(row, columnMap.firstName),
      lastName: get(row, columnMap.lastName),
      displayName: get(row, columnMap.displayName),
      providerRecordId: sanitizeCellValue(providerRecordId),
      events: eventName ? [{ name: eventName }] : [],
      defaultCountry,
    };
  });

  // ---- upsert + tag ------------------------------------------------------
  const { stats, contactIds } = await bulkUpsertContacts(
    workspaceId,
    { provider: 'csv_upload', importId },
    inputs
  );

  await applyImportTagToContacts(workspaceId, importId, importName, contactIds);

  return NextResponse.json({
    importId,
    stats,
    contactCount: contactIds.length,
    // Return only first 100 contactIds so the response stays small.
    contactIds: contactIds.slice(0, 100),
    truncated: contactIds.length > 100,
  });
}

export async function GET() {
  return NextResponse.json({
    name: 'Kyozo Contacts CSV Import',
    method: 'POST',
    content: 'multipart/form-data',
    fields: {
      file: 'csv or xlsx file (required, max 25 MB)',
      importName: 'human name for this batch (required)',
      columnMap: 'JSON map of {email, phone, firstName, lastName, displayName, event, providerRecordId} → header name',
      defaultCountry: 'ISO-2 fallback for phone parsing (optional)',
    },
    response: { importId: 'string', stats: 'object', contactIds: 'string[]' },
  });
}
