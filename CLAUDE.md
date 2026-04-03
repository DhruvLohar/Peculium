# Expo & React Native Best Practices

You are an expert React Native and Expo developer. When writing, refactoring, or generating code, you MUST adhere strictly to the following performance, architectural, and structural guidelines. 

## 1. Performance & Memoization (Strict Rules)
To ensure 60fps performance and avoid unnecessary re-renders, apply these rules without exception:
- **`memo`**: EVERY React component must be wrapped and exported using `React.memo`.
- **`useCallback`**: EVERY function or event handler defined inside a component must be wrapped in `useCallback` with a strictly defined dependency array.
- **`useMemo`**: EVERY complex calculation, derived state, or non-primitive value (objects/arrays) created inside a component and passed as a prop MUST be wrapped in `useMemo`.

## 2. File Structure & Component Hierarchy
NEVER write monolithic files. Break down the UI into small, modular, single-responsibility components. Organize them strictly as follows:

- `src/components/atoms/`: Use this for highly reusable, "dumb" UI elements that manage little to no state (e.g., `CustomText`, `ActionButton`, `CardBase`, `InputBox`).
- `src/components/[ScreenName]/`: Use this for composite components that belong specifically to one screen. Do not clutter global folders with screen-specific code (e.g., `src/components/Dashboard/BalanceOverview.tsx`, `src/components/Transactions/TransactionEntry.tsx`).

## 3. Separation of Concerns (Hooks)
- UI components must remain clean and solely focused on presentation. 
- You MUST extract difficult logic, API integrations, data transformations, and recurring state management into custom hooks inside a `src/hooks/` directory (e.g., `useTransactionData`, `useAuthSession`).

## 4. Code Generation Standard
When writing components, use the following pattern as your baseline:

```tsx
import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTransactionLogic } from '../../hooks/useTransactionLogic';
import ActionButton from '../atoms/ActionButton';

interface TransactionEntryProps {
  id: string;
  amount: number;
  description: string;
  onPress: (id: string) => void;
}

const TransactionEntry: React.FC<TransactionEntryProps> = ({ 
  id, 
  amount, 
  description, 
  onPress 
}) => {
  const { formatCurrency } = useTransactionLogic();

  // 1. Memoize derived data
  const formattedAmount = useMemo(() => {
    return formatCurrency(amount);
  }, [amount, formatCurrency]);

  // 2. Memoize functions
  const handlePress = useCallback(() => {
    onPress(id);
  }, [id, onPress]);

  return (
    <TouchableOpacity onPress={handlePress} className="flex-row justify-between p-4 bg-white rounded-lg mb-2">
      <Text className="text-gray-800 text-base font-medium">{description}</Text>
      <Text className="text-emerald-600 text-base font-bold">{formattedAmount}</Text>
    </TouchableOpacity>
  );
};

// 3. Export with memo
export default memo(TransactionEntry);
```

## 5. Data Fetching & API Architecture (Supabase + TanStack Query)
- Use **Supabase** as the API/data layer.
- Use **TanStack Query** for all server-state fetching/caching/sync.
- Keep Supabase calls inside dedicated hooks in `src/hooks/` (for example: `useUser.ts`, `useTransactions.ts`, `useInsights.ts`).
- Screens/components must consume hooks, not call Supabase directly.

Reference pattern:

```ts
// src/hooks/useTransactions.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';

export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        throw new Error(error.message); // TanStack catches this automatically
      }

      return data;
    },
  });
};
```

## 6. Design System Rule (Neo-Brutalism + Atoms First)
- We use **Neo-Brutalism** as the base design system across the app.
- Every UI building block should come from `src/components/atoms/`.
- If a required primitive does not exist, create it in `atoms` first, then compose pages/screens from those atoms.
- Avoid writing one-off visual primitives directly inside page/screen files.
