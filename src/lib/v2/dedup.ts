/**
 * Identity normalization + dedup keys for the Contact model.
 *
 * Why this matters: the onboarding flow promises "1,210 duplicates merged".
 * That claim is only as good as our normalization. Bad normalization
 * either fails to merge real duplicates (mild) or merges two distinct
 * humans into one record (severe — wrong emails, wrong messages, audit
 * trail points at the wrong person). Test this aggressively.
 */

import { createHash } from 'crypto';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

/**
 * Parse any phone string to E.164. Returns null if it can't be parsed
 * even with the workspace's default country hint.
 *
 * Examples:
 *   normalizeE164("+1 (555) 123-4567", "US") -> "+15551234567"
 *   normalizeE164("0207 946 0123",   "GB") -> "+442079460123"
 *   normalizeE164("abc",             "US") -> null
 */
export function normalizeE164(
  input: string | null | undefined,
  defaultCountry?: CountryCode
): string | null {
  if (!input) return null;
  try {
    const parsed = parsePhoneNumberFromString(input, defaultCountry);
    if (!parsed || !parsed.isValid()) return null;
    return parsed.number; // E.164 with leading '+'
  } catch {
    return null;
  }
}

/** Extract ISO-2 country code from a successfully-parsed phone number. */
export function countryFromPhone(
  input: string | null | undefined,
  defaultCountry?: CountryCode
): CountryCode | null {
  if (!input) return null;
  try {
    const parsed = parsePhoneNumberFromString(input, defaultCountry);
    return parsed?.country || null;
  } catch {
    return null;
  }
}

/**
 * Normalize an email to a canonical form for dedup:
 *   - lowercase the entire address (RFC says local-part is case-sensitive
 *     in theory; in practice Gmail/Outlook/etc. treat it case-insensitively
 *     and dedup will be wrong if we don't lowercase).
 *   - trim surrounding whitespace.
 *
 * Returns null if it doesn't look like an email.
 */
export function normalizeEmail(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

/**
 * Compute the dedup key for a contact within a workspace.
 *
 * Identity rules (in priority order):
 *   1. If we have phoneE164: key = sha256(workspaceId + ':p:' + phoneE164)
 *   2. Else if we have emailLower: key = sha256(workspaceId + ':e:' + emailLower)
 *   3. Else: return null (cannot dedup; treat each as unique).
 *
 * Phone wins because it's the strongest cross-platform identifier in this
 * vertical (Eventbrite, RA, 7 Rooms, phone CSV) and because email is more
 * commonly faked or shared.
 *
 * We do NOT join on (phone OR email). Doing so would cause transitive
 * merges (A shares phone with B; B shares email with C; A merges with C
 * even though A and C have nothing in common). Single-key joins keep the
 * merge graph simple and reversible.
 */
export function computeDedupKey(
  workspaceId: string,
  fields: { phoneE164?: string | null; emailLower?: string | null }
): string | null {
  if (fields.phoneE164) {
    return sha256(`${workspaceId}:p:${fields.phoneE164}`);
  }
  if (fields.emailLower) {
    return sha256(`${workspaceId}:e:${fields.emailLower}`);
  }
  return null;
}

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

/**
 * Sanitize a string against CSV/spreadsheet formula injection.
 * Apply to every cell coming from user-uploaded files BEFORE persisting.
 *
 * Excel evaluates leading =, +, -, @, and \t as formula starters; opening
 * an exported CSV in Excel can then execute the formula. Prefix with a
 * single quote to neutralize.
 */
export function sanitizeCellValue(input: string | null | undefined): string {
  if (input == null) return '';
  const s = String(input);
  if (/^[=+\-@\t]/.test(s)) return `'${s}`;
  return s;
}
