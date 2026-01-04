/**
 * Shared typography styles for all content cards
 * Update these values to change styling across all cards
 */

export const cardTitleStyle = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontWeight: 700,
  textTransform: 'none' as const,
  letterSpacing: '-0.02em',
};

export const cardBodyStyle = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontWeight: 400,
  lineHeight: 1.6
};

// Color constants
export const CARD_TITLE_COLOR = '#4b4848ff';
export const CARD_BODY_COLOR = '#5a5a5a';
