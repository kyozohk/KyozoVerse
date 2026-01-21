export const THEME_COLORS = {
  overview: {
    primary: '#843484',
    border: 'rgba(132, 52, 132, 0.5)',
    borderSolid: '#843484',
    bg: 'rgba(132, 52, 132, 0.1)',
  },
  members: {
    primary: '#06C4B5',
    border: 'rgba(6, 196, 181, 0.5)',
    borderSolid: '#06C4B5',
    bg: 'rgba(6, 196, 181, 0.1)',
  },
  broadcast: {
    primary: '#E1B327',
    border: 'rgba(225, 179, 39, 0.5)',
    borderSolid: '#E1B327',
    bg: 'rgba(225, 179, 39, 0.1)',
  },
  inbox: {
    primary: '#699FE5',
    border: 'rgba(105, 159, 229, 0.5)',
    borderSolid: '#699FE5',
    bg: 'rgba(105, 159, 229, 0.1)',
  },
  feed: {
    primary: '#CF7770',
    border: 'rgba(207, 119, 112, 0.5)',
    borderSolid: '#CF7770',
    bg: 'rgba(207, 119, 112, 0.1)',
  },
  communities: {
    primary: '#843484',
    border: 'rgba(132, 52, 132, 0.5)',
    borderSolid: '#843484',
    bg: 'rgba(132, 52, 132, 0.1)',
  },
  analytics: {
    primary: '#06C4B5',
    border: 'rgba(6, 196, 181, 0.5)',
    borderSolid: '#06C4B5',
    bg: 'rgba(6, 196, 181, 0.1)',
  },
  subscription: {
    primary: '#E1B327',
    border: 'rgba(225, 179, 39, 0.5)',
    borderSolid: '#E1B327',
    bg: 'rgba(225, 179, 39, 0.1)',
  },
  settings: {
    primary: '#699FE5',
    border: 'rgba(105, 159, 229, 0.5)',
    borderSolid: '#699FE5',
    bg: 'rgba(105, 159, 229, 0.1)',
  },
  waitlist: {
    primary: '#CF7770',
    border: 'rgba(207, 119, 112, 0.5)',
    borderSolid: '#CF7770',
    bg: 'rgba(207, 119, 112, 0.1)',
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
