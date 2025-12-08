/**
 * Centralized color configuration for the entire application
 * These colors are used across dashboard, feature cards, marquee, and all components
 */

export const THEME_COLORS = {
  // Category-based colors
  inbox: {
    primary: '#6495ED',           // Cornflower blue
    light: '#ADD8E6',             // Light blue
    bg: 'rgba(173, 216, 230, 0.4)',
    bgSolid: '#ADD8E6',
    border: 'rgba(100, 149, 237, 0.6)',
    borderSolid: '#6495ED',
  },
  overview: {
    primary: '#BA55D3',           // Medium orchid
    light: '#DDA0DD',             // Light purple/plum
    bg: 'rgba(221, 160, 221, 0.4)',
    bgSolid: '#DDA0DD',
    border: 'rgba(186, 85, 211, 0.6)',
    borderSolid: '#BA55D3',
  },
  broadcast: {
    primary: '#B4582E',           // Terracotta/burnt orange
    light: '#E8A587',             // Light terracotta
    bg: 'rgba(180, 88, 46, 0.15)',
    bgSolid: '#E8A587',
    border: 'rgba(180, 88, 46, 0.6)',
    borderSolid: '#B4582E',
  },
  members: {
    primary: '#DB7093',           // Pale violet red
    light: '#FFB6C1',             // Light pink
    bg: 'rgba(255, 182, 193, 0.4)',
    bgSolid: '#FFB6C1',
    border: 'rgba(219, 112, 147, 0.6)',
    borderSolid: '#DB7093',
  },
  feed: {
    primary: '#0A5D72',           // Deep teal
    light: '#5FA8BB',             // Light teal
    bg: 'rgba(10, 93, 114, 0.15)',
    bgSolid: '#5FA8BB',
    border: 'rgba(10, 93, 114, 0.6)',
    borderSolid: '#0A5D72',
  },
} as const;

export type CategoryKey = keyof typeof THEME_COLORS;

/**
 * Get theme colors for a specific category
 */
export function getCategoryColors(category: CategoryKey) {
  return THEME_COLORS[category] || THEME_COLORS.inbox;
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
