/**
 * Centralized color configuration for the entire application
 * These now point to the new CSS variables for a single, unified theme.
 */

const unifiedPrimaryColor = 'hsl(var(--primary))';
const unifiedAccentColor = 'hsl(var(--accent))';
const unifiedAccentFgColor = 'hsl(var(--accent-foreground))';

const colorSet = {
  primary: unifiedPrimaryColor,
  active: unifiedAccentFgColor,
  bg: unifiedAccentColor,
  border: 'hsl(var(--border))'
};

export const THEME_COLORS = {
  inbox: colorSet,
  overview: colorSet,
  broadcast: colorSet,
  members: colorSet,
  feed: colorSet,
  settings: colorSet,
  ticketing: colorSet,
  integrations: colorSet,
  communities: colorSet,
  analytics: colorSet,
  subscription: colorSet,
  default: colorSet,
} as const;

export type CategoryKey = keyof typeof THEME_COLORS;

/**
 * Get theme colors for a specific category
 */
export function getCategoryColors(category: CategoryKey) {
  return THEME_COLORS[category] || THEME_COLORS.default;
}

/**
 * Get theme colors from path (e.g., '/feed', '/overview')
 */
export function getColorsFromPath(path: string) {
  const category = path.replace('/', '') as CategoryKey;
  return getCategoryColors(category);
}

/**
 * Helper to convert hex to rgba
 */
export function hexToRgba(hex: string, alpha: number): string {
  if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return 'rgba(0,0,0,0)';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
