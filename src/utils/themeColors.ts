export const LIGHT = {
  border: '#000000',
  foreground: '#000000',
  muted: '#aeaeae',
  destructive: '#e63946',
} as const;

export const DARK = {
  border: '#3a3a3a',
  foreground: '#f5f5f5',
  muted: '#3f3f46',
  destructive: '#e63946',
} as const;

export const getThemeColors = (isDark: boolean) => (isDark ? DARK : LIGHT);
