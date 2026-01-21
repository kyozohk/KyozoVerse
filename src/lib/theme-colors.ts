
export const THEME_COLORS = {
    overview: {
      primary: '#843484',
      border: 'rgba(132, 52, 132, 0.2)',
    },
    members: {
      primary: '#06C4B5',
      border: 'rgba(6, 196, 181, 0.2)',
    },
    broadcast: {
      primary: '#E1B327',
      border: 'rgba(225, 179, 39, 0.2)',
    },
    inbox: {
      primary: '#699FE5',
      border: 'rgba(105, 159, 229, 0.2)',
    },
    feed: {
      primary: '#CF7770',
      border: 'rgba(207, 119, 112, 0.2)',
    },
    communities: {
        primary: '#843484',
        border: 'rgba(132, 52, 132, 0.2)',
    },
    analytics: {
        primary: '#06C4B5',
        border: 'rgba(6, 196, 181, 0.2)',
    },
    subscription: {
        primary: '#E1B327',
        border: 'rgba(225, 179, 39, 0.2)',
    },
    settings: {
        primary: '#699FE5',
        border: 'rgba(105, 159, 229, 0.2)',
    },
    ticketing: {
      primary: '#E1B327', // Same as subscription
      border: 'rgba(225, 179, 39, 0.2)',
    },
    integrations: {
        primary: '#699FE5', // Same as settings
        border: 'rgba(105, 159, 229, 0.2)',
    }
  };
  
export type CategoryKey = keyof typeof THEME_COLORS;

export const getCategoryColors = (category: CategoryKey) => {
    const colors = THEME_COLORS[category] || THEME_COLORS.overview;
    return {
        bg: colors.border,
        border: colors.primary
    };
};

export const hexToRgba = (hex: string, alpha: number) => {
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return 'rgba(0,0,0,0)';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
