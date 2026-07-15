import { useColorScheme } from 'react-native';

/**
 * Calm, low-stimulation palette. ADHD-friendly: soft contrast, few colors,
 * clear accent for the single primary action on any screen.
 */
export const palette = {
  primary: '#5B4B8A',
  primarySoft: '#EAE6F5',
  accent: '#3BA99C',
  danger: '#D96A6A',
  amber: '#E0A458',
};

/** Options offered when picking a routine color. */
export const routineColors = [
  '#5B4B8A',
  '#3BA99C',
  '#E0A458',
  '#D96A6A',
  '#4A7DB5',
  '#7BA05B',
];

export type Theme = {
  bg: string;
  card: string;
  cardAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primarySoft: string;
  accent: string;
  danger: string;
  amber: string;
  isDark: boolean;
};

const light: Theme = {
  bg: '#F6F5FB',
  card: '#FFFFFF',
  cardAlt: '#F0EEF8',
  text: '#1E1B2E',
  textMuted: '#6B6880',
  border: '#E4E1EE',
  ...palette,
  isDark: false,
};

const dark: Theme = {
  bg: '#131120',
  card: '#1F1C30',
  cardAlt: '#272338',
  text: '#F2F1F7',
  textMuted: '#9B97AE',
  border: '#332E47',
  primary: '#8A79C4',
  primarySoft: '#2A2540',
  accent: '#4FC0B2',
  danger: '#E38585',
  amber: '#E9B876',
  isDark: true,
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}
