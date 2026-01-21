export const THEME_COLORS = {
  overview: {
    primary: '#d4c1a8',
    border: 'rgba(212, 193, 168, 0.5)',
    borderSolid: '#d4c1a8',
    bg: 'rgba(212, 193, 168, 0.1)',
  },
  members: {
    primary: '#d4c1a8',
    border: 'rgba(212, 193, 168, 0.5)',
    borderSolid: '#d4c1a8',
    bg: 'rgba(212, 193, 168, 0.1)',
  },
  broadcast: {
    primary: '#d4c1a8',
    border: 'rgba(212, 193, 168, 0.5)',
    borderSolid: '#d4c1a8',
    bg: 'rgba(212, 193, 168, 0.1)',
  },
  inbox: {
    primary: '#d4c1a8',
    border: 'rgba(212, 193, 168, 0.5)',
    borderSolid: '#d4c1a8',
    bg: 'rgba(212, 193, 168, 0.1)',
  },
  feed: {
    primary: '#d4c1a8',
    border: 'rgba(212, 193, 168, 0.5)',
    borderSolid: '#d4c1a8',
    bg: 'rgba(212, 193, 168, 0.1)',
  },
  communities: {
    primary: '#d4c1a8',
    border: 'rgba(212, 193, 168, 0.5)',
    borderSolid: '#d4c1a8',
    bg: 'rgba(212, 193, 168, 0.1)',
  },
  analytics: {
    primary: '#d4c1a8',
    border: 'rgba(212, 193, 168, 0.5)',
    borderSolid: '#d4c1a8',
    bg: 'rgba(212, 193, 168, 0.1)',
  },
  subscription: {
    primary: '#d4c1a8',
    border: 'rgba(212, 193, 168, 0.5)',
    borderSolid: '#d4c1a8',
    bg: 'rgba(212, 193, 168, 0.1)',
  },
  settings: {
    primary: '#d4c1a8',
    border: 'rgba(212, 193, 168, 0.5)',
    borderSolid: '#d4c1a8',
    bg: 'rgba(212, 193, 168, 0.1)',
  },
  waitlist: {
    primary: '#d4c1a8',
    border: 'rgba(212, 193, 168, 0.5)',
    borderSolid: '#d4c1a8',
    bg: 'rgba(212, 193, 168, 0.1)',
  },
};

export type CategoryKey = keyof typeof THEME_COLORS;

export function getCategoryColors(category: CategoryKey) {
  return THEME_COLORS[category] || { bg: '#e5e7eb', border: '#d1d5db' };
}

export const hexToRgba = (hex: string, alpha: number): string => {
  if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) {
    // Return a default if hex is invalid to avoid crashes
    return `rgba(0, 0, 0, ${alpha})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
