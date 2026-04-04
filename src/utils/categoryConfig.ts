import type { TransactionCategory } from '@/hooks/useTransactions';

export const CATEGORY_CONFIG: Record<TransactionCategory, { icon: string; label: string; bg: string }> = {
  Groceries: { icon: 'shopping-cart', label: 'GROCERIES', bg: '#06b6d4' },
  Rent:      { icon: 'apartment',     label: 'RENT',       bg: '#f97316' },
  Food:      { icon: 'restaurant',    label: 'FOOD',       bg: '#a855f7' },
  Travel:    { icon: 'flight',        label: 'TRAVEL',     bg: '#ec4899' },
  Home:      { icon: 'home',          label: 'HOME',       bg: '#3b82f6' },
  Salary:    { icon: 'payments',      label: 'SALARY',     bg: '#22c55e' },
  Health:    { icon: 'favorite',      label: 'HEALTH',     bg: '#ef4444' },
  Other:     { icon: 'category',      label: 'OTHER',      bg: '#6b7280' },
};

export const CATEGORY_LIST = Object.entries(CATEGORY_CONFIG).map(([value, config]) => ({
  value: value as TransactionCategory,
  ...config,
}));
