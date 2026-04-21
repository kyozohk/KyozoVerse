/**
 * Validation utilities for community handles (URL slugs)
 * Handles must be URL-safe and follow specific formatting rules
 */

export interface HandleValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a community handle to ensure it's URL-safe
 * 
 * Rules:
 * - Only lowercase letters (a-z), numbers (0-9), and hyphens (-)
 * - Cannot start or end with a hyphen
 * - Cannot contain consecutive hyphens
 * - Must be between 3 and 50 characters
 * - Cannot be empty
 * 
 * @param handle - The handle to validate
 * @returns Validation result with error message if invalid
 */
export function validateHandle(handle: string): HandleValidationResult {
  // Check if empty
  if (!handle || handle.trim().length === 0) {
    return {
      isValid: false,
      error: 'Handle cannot be empty'
    };
  }

  // Check length
  if (handle.length < 3) {
    return {
      isValid: false,
      error: 'Handle must be at least 3 characters long'
    };
  }

  if (handle.length > 50) {
    return {
      isValid: false,
      error: 'Handle must be 50 characters or less'
    };
  }

  // Check for invalid characters (only allow a-z, 0-9, and -)
  const validCharactersRegex = /^[a-z0-9-]+$/;
  if (!validCharactersRegex.test(handle)) {
    return {
      isValid: false,
      error: 'Handle can only contain lowercase letters, numbers, and hyphens'
    };
  }

  // Check if starts or ends with hyphen
  if (handle.startsWith('-') || handle.endsWith('-')) {
    return {
      isValid: false,
      error: 'Handle cannot start or end with a hyphen'
    };
  }

  // Check for consecutive hyphens
  if (handle.includes('--')) {
    return {
      isValid: false,
      error: 'Handle cannot contain consecutive hyphens'
    };
  }

  return { isValid: true };
}

/**
 * Sanitizes a string to create a valid handle.
 *
 * KYPRO-60: previously, any non-Latin input (e.g. "клавдий", "你好") produced an
 * empty string because `replace(/[^a-z0-9-]/g, '')` stripped every character.
 * Empty handles then triggered KYPRO-61 (backend stored the raw community name
 * as the URL slug, which crashed `decodeURIComponent`).
 *
 * KYPRO-56: a community name ending in a special character could leave a
 * trailing hyphen in the result. We now strip leading/trailing hyphens AFTER
 * truncating to 50 chars, so the substring boundary cannot reintroduce one.
 *
 * This function does NOT return empty for non-empty input. If sanitization
 * would be empty, we fall back to a deterministic slug derived from a hash
 * of the input so downstream code always has a URL-safe handle.
 */
export function sanitizeHandle(input: string): string {
  if (!input) return '';
  // Normalize and strip diacritics ("café" -> "cafe") so non-ASCII Latin-like
  // characters survive sanitization instead of being stripped wholesale.
  const normalized = input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const sanitized = normalized
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    // Clip to 50 BEFORE trimming hyphens so a trailing-hyphen intermediate
    // doesn't survive the substring slice (KYPRO-56).
    .substring(0, 50)
    .replace(/^-+|-+$/g, '');

  if (sanitized) return sanitized;

  // Non-Latin or all-special input produced an empty result. Return a safe
  // fallback based on a simple djb2 hash so the handle is deterministic for
  // the same input and always URL-safe (KYPRO-60 / KYPRO-61).
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return `community-${hash.toString(36)}`;
}

/**
 * Reserved handles that cannot be used for communities
 * These are system routes or common paths that should not be community handles
 */
export const RESERVED_HANDLES = [
  'api',
  'admin',
  'account',
  'analytics',
  'auth',
  'login',
  'logout',
  'signup',
  'settings',
  'profile',
  'dashboard',
  'communities',
  'communes',
  'developer',
  'docs',
  'help',
  'support',
  'about',
  'terms',
  'privacy',
  'contact',
  'blog',
  'news',
  'static',
  'public',
  'assets',
  'uploads',
  'files',
  'images',
  'videos',
  'app',
  'www',
  'mail',
  'email',
  'ftp',
  'ssh',
  'root',
  'system',
  'config',
];

/**
 * Checks if a handle is reserved
 * 
 * @param handle - The handle to check
 * @returns True if the handle is reserved
 */
export function isReservedHandle(handle: string): boolean {
  return RESERVED_HANDLES.includes(handle.toLowerCase());
}

/**
 * Complete validation including reserved handle check
 * 
 * @param handle - The handle to validate
 * @returns Validation result with error message if invalid
 */
export function validateHandleComplete(handle: string): HandleValidationResult {
  // First check basic validation
  const basicValidation = validateHandle(handle);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // Check if reserved
  if (isReservedHandle(handle)) {
    return {
      isValid: false,
      error: 'This handle is reserved and cannot be used'
    };
  }

  return { isValid: true };
}
