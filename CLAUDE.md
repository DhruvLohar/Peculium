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
- **Mutations**: Use `useMutation` for any write/auth operation (sign in, update profile, etc.). Never use plain `useState` + `useCallback` for async Supabase calls.
- **Refresh Control**: EVERY screen that fetches data MUST implement pull-to-refresh using `RefreshControl` wired to the query's `refetch` function.

Reference patterns:

```ts
// src/hooks/useTransactions.ts — query pattern
import { useQuery } from '@tanstack/react-query';
import supabase from '../utils/supabase';

export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw new Error(error.message);
      return data;
    },
  });
};
```

```tsx
// Pull-to-refresh pattern in any data-fetching screen
import { ScrollView, RefreshControl } from 'react-native';

const { data, refetch, isRefetching } = useTransactions();

<ScrollView
  refreshControl={
    <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
  }
>
  {/* screen content */}
</ScrollView>
```

```ts
// src/hooks/useUserAuth.ts — mutation pattern for auth operations
import { useMutation } from '@tanstack/react-query';
import supabase from '../utils/supabase';

export const useUserAuth = () => {
  const sendOtp = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw new Error(error.message);
    },
  });

  const verifyOtp = useMutation({
    mutationFn: async ({ email, token }: { email: string; token: string }) => {
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
      if (error || !data.user) throw new Error(error?.message ?? 'Verification failed');
      // check/upsert profile, return needsOnboarding boolean
    },
  });

  return { sendOtp, verifyOtp };
};
```

## 6. Form Handling (Zod + React Hook Form)
- **EVERY form in the app MUST use `react-hook-form` with a `zod` schema via `@hookform/resolvers/zod`.**
- Define all schemas in `src/utils/schemas.ts` and import from there — never inline schemas inside components.
- Use `Controller` to wrap every `Input` atom (React Native controlled inputs are not compatible with uncontrolled RHF refs).
- Display field-level errors from `formState.errors` below each input — never manage error state manually with `useState`.
- The `Button` `onPress` must always call `handleSubmit(onSubmit)` — never wire up submit manually.

Reference pattern:

```tsx
// src/utils/schemas.ts
import { z } from 'zod';
export const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});
export type EmailFormValues = z.infer<typeof emailSchema>;
```

```tsx
// Inside a screen component
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emailSchema, type EmailFormValues } from '../../../utils/schemas';

const { control, handleSubmit, formState: { errors } } = useForm<EmailFormValues>({
  resolver: zodResolver(emailSchema),
  defaultValues: { email: '' },
});

<Controller
  control={control}
  name="email"
  render={({ field: { onChange, value } }) => (
    <Input
      value={value}
      onChangeText={onChange}
      isInvalid={!!errors.email}
    />
  )}
/>
{errors.email && <CustomText variant="muted">{errors.email.message}</CustomText>}

<Button onPress={handleSubmit(onSubmit)}>Submit</Button>
```

## 7. Design System Rule (Neo-Brutalism + Atoms First)
- We use **Neo-Brutalism** as the base design system across the app.
- Every UI building block should come from `src/components/atoms/`.
- If a required primitive does not exist, create it in `atoms` first, then compose pages/screens from those atoms.
- Avoid writing one-off visual primitives directly inside page/screen files.
