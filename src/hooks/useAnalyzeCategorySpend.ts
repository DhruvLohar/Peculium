import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { CATEGORY_CONFIG } from '@/utils/categoryConfig';
import type { TransactionCategory } from './useTransactions';

// Vibrant neo-brutalist colors per category
export const TREEMAP_COLORS: Record<TransactionCategory, string> = {
  Groceries: '#fb923c', // Orange
  Rent:      '#facc15', // Yellow
  Food:      '#ef4444', // Red
  Travel:    '#a3e635', // Acid Green
  Home:      '#60a5fa', // Blue
  Salary:    '#22c55e', // Green
  Health:    '#f472b6', // Pink
  Other:     '#d4d4d8', // Gray
};

export interface CategorySpendItem {
  category: TransactionCategory;
  label: string;
  icon: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface TreemapBlock extends CategorySpendItem {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Recursive binary-split treemap algorithm on a 0–100 coordinate grid
const buildTreemap = (
  data: CategorySpendItem[],
  x: number,
  y: number,
  width: number,
  height: number,
): TreemapBlock[] => {
  if (data.length === 0) return [];
  if (data.length === 1) return [{ ...data[0], x, y, width, height }];

  const total = data.reduce((sum, d) => sum + d.amount, 0);
  const half = total / 2;
  let running = 0;
  let splitIndex = 1;

  for (let i = 0; i < data.length; i++) {
    running += data[i].amount;
    if (running >= half) {
      const diffWith = Math.abs(running - half);
      const diffWithout = Math.abs(running - data[i].amount - half);
      splitIndex = i > 0 && diffWithout < diffWith ? i : i + 1;
      break;
    }
  }

  splitIndex = Math.max(1, Math.min(splitIndex, data.length - 1));

  const leftData = data.slice(0, splitIndex);
  const rightData = data.slice(splitIndex);
  const weightRatio = leftData.reduce((s, d) => s + d.amount, 0) / total;

  if (width >= height) {
    const splitWidth = width * weightRatio;
    return [
      ...buildTreemap(leftData, x, y, splitWidth, height),
      ...buildTreemap(rightData, x + splitWidth, y, width - splitWidth, height),
    ];
  } else {
    const splitHeight = height * weightRatio;
    return [
      ...buildTreemap(leftData, x, y, width, splitHeight),
      ...buildTreemap(rightData, x, y + splitHeight, width, height - splitHeight),
    ];
  }
};

export const useAnalyzeCategorySpend = (month?: number, year?: number) => {
  const now = new Date();
  const { data: transactions = [], isLoading } = useTransactions({
    type: 'EXPENSE',
    month: month ?? now.getMonth() + 1,
    year: year ?? now.getFullYear(),
  });

  const { blocks, totalSpend } = useMemo(() => {
    const categoryTotals: Partial<Record<TransactionCategory, number>> = {};

    for (const tx of transactions) {
      const cat = tx.category as TransactionCategory;
      categoryTotals[cat] = (categoryTotals[cat] ?? 0) + tx.amount;
    }

    const total = Object.values(categoryTotals).reduce<number>((s, v) => s + (v ?? 0), 0);
    if (total === 0) return { blocks: [] as TreemapBlock[], totalSpend: 0 };

    const categories: CategorySpendItem[] = (
      Object.entries(categoryTotals) as [TransactionCategory, number][]
    )
      .map(([category, amount]) => ({
        category,
        label: CATEGORY_CONFIG[category]?.label ?? category.toUpperCase(),
        icon: CATEGORY_CONFIG[category]?.icon ?? 'category',
        amount,
        percentage: Math.round((amount / total) * 100),
        color: TREEMAP_COLORS[category] ?? '#d4d4d8',
      }))
      .sort((a, b) => b.amount - a.amount);

    return { blocks: buildTreemap(categories, 0, 0, 100, 100), totalSpend: total };
  }, [transactions]);

  return { blocks, totalSpend, isLoading };
};
