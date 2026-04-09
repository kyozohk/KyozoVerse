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
 * Sanitizes a string to create a valid handle
 * Converts to lowercase, replaces spaces and invalid chars with hyphens
 * 
 * @param input - The input string to sanitize
 * @returns A sanitized handle string (empty if no valid characters found)
 */
export function sanitizeHandle(input: string): string {
  const sanitized = input
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove all characters except a-z, 0-9, and -
    .replace(/[^a-z0-9-]/g, '')
    // Replace consecutive hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit to 50 characters
    .substring(0, 50);
  
  // If sanitization results in empty or too short handle, return empty string
  // The calling code should handle this case (e.g., show error or generate fallback)
  return sanitized;
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
