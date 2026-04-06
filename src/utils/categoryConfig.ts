import type { TransactionCategory, TransactionType } from '@/hooks/useTransactions';

export const CATEGORY_CONFIG: Record<TransactionCategory, { icon: string; label: string; bg: string; types: TransactionType[] }> = {
  Groceries: { icon: 'shopping-cart', label: 'GROCERIES', bg: '#06b6d4', types: ['EXPENSE'] },
  Rent:      { icon: 'apartment',     label: 'RENT',       bg: '#f97316', types: ['EXPENSE'] },
  Food:      { icon: 'restaurant',    label: 'FOOD',       bg: '#a855f7', types: ['EXPENSE'] },
  Travel:    { icon: 'flight',        label: 'TRAVEL',     bg: '#ec4899', types: ['EXPENSE'] },
  Home:      { icon: 'home',          label: 'HOME',       bg: '#3b82f6', types: ['EXPENSE'] },
  Salary:    { icon: 'payments',      label: 'SALARY',     bg: '#22c55e', types: ['INCOME'] },
  Health:    { icon: 'favorite',      label: 'HEALTH',     bg: '#ef4444', types: ['EXPENSE'] },
  Other:     { icon: 'category',      label: 'OTHER',      bg: '#6b7280', types: ['INCOME', 'EXPENSE'] },
};

export const CATEGORY_LIST = Object.entries(CATEGORY_CONFIG).map(([value, config]) => ({
  value: value as TransactionCategory,
  ...config,
}));

export const getCategoriesByType = (type: TransactionType): typeof CATEGORY_LIST => {
  return CATEGORY_LIST.filter((cat) => cat.types.includes(type));
};
