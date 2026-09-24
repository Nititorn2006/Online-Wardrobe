import { Platform } from 'react-native';

export const Palette = {
  background: '#F7F5F1',
  surface: '#FFFFFF',
  ink: '#202826',
  muted: '#727A77',
  brand: '#4338B8',
  brandDark: '#30288A',
  brandSoft: '#ECEAFF',
  lavender: '#EEE7F0',
  coral: '#EF6A67',
  coralSoft: '#FCE4E1',
  border: '#E3E5E1',
  danger: '#BD3F43',
  white: '#FFFFFF',
} as const;

export const Layout = {
  gutter: 20,
  maxWidth: 720,
  tabClearance: Platform.select({ ios: 108, android: 124, web: 108 }) ?? 108,
} as const;

export const Radius = {
  small: 12,
  medium: 18,
  large: 26,
  pill: 999,
} as const;
