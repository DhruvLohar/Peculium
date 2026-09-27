import type { TransactionCategory, TransactionType } from '@/hooks/useTransactions';

export const CATEGORY_CONFIG: Record<
  TransactionCategory,
  { icon: string; label: string; bg: string; types: TransactionType[] }
> = {
  Groceries: { icon: 'shopping-cart', label: 'GROCERIES', bg: '#06b6d4', types: ['EXPENSE'] },
  Rent: { icon: 'apartment', label: 'RENT', bg: '#f97316', types: ['EXPENSE'] },
  Food: { icon: 'restaurant', label: 'FOOD', bg: '#a855f7', types: ['EXPENSE'] },
  Travel: { icon: 'flight', label: 'TRAVEL', bg: '#ec4899', types: ['EXPENSE'] },
  Home: { icon: 'home', label: 'HOME', bg: '#3b82f6', types: ['EXPENSE'] },
  Salary: { icon: 'payments', label: 'SALARY', bg: '#22c55e', types: ['INCOME'] },
  Health: { icon: 'favorite', label: 'HEALTH', bg: '#ef4444', types: ['EXPENSE'] },
  Drinks: { icon: 'local-bar', label: 'DRINKS', bg: '#0ea5e9', types: ['EXPENSE'] },
  Snacks: { icon: 'fastfood', label: 'SNACKS', bg: '#f59e0b', types: ['EXPENSE'] },
  Subscriptions: {
    icon: 'subscriptions',
    label: 'SUBSCRIPTIONS',
    bg: '#8b5cf6',
    types: ['EXPENSE'],
  },
  Entertainment: { icon: 'movie', label: 'ENTERTAINMENT', bg: '#d946ef', types: ['EXPENSE'] },
  Shopping: { icon: 'shopping-bag', label: 'SHOPPING', bg: '#e11d48', types: ['EXPENSE'] },
  Transport: { icon: 'directions-bus', label: 'TRANSPORT', bg: '#0891b2', types: ['EXPENSE'] },
  Bills: { icon: 'receipt', label: 'BILLS', bg: '#7c3aed', types: ['EXPENSE'] },
  PersonalCare: { icon: 'spa', label: 'PERSONAL CARE', bg: '#f472b6', types: ['EXPENSE'] },
  Fitness: { icon: 'fitness-center', label: 'FITNESS', bg: '#16a34a', types: ['EXPENSE'] },
  Freelance: { icon: 'work', label: 'FREELANCE', bg: '#059669', types: ['INCOME'] },
  Refund: { icon: 'undo', label: 'REFUND', bg: '#10b981', types: ['INCOME'] },
  Allowance: {
    icon: 'account-balance-wallet',
    label: 'ALLOWANCE',
    bg: '#84cc16',
    types: ['INCOME'],
  },
  Gifts: { icon: 'card-giftcard', label: 'GIFTS', bg: '#f43f5e', types: ['INCOME', 'EXPENSE'] },
  Investments: {
    icon: 'trending-up',
    label: 'INVESTMENTS',
    bg: '#2563eb',
    types: ['INCOME', 'EXPENSE'],
  },
  Other: { icon: 'category', label: 'OTHER', bg: '#6b7280', types: ['INCOME', 'EXPENSE'] },
};

export const CATEGORY_LIST = Object.entries(CATEGORY_CONFIG).map(([value, config]) => ({
  value: value as TransactionCategory,
  ...config,
}));

export const getCategoriesByType = (type: TransactionType): typeof CATEGORY_LIST => {
  return CATEGORY_LIST.filter((cat) => cat.types.includes(type));
};
