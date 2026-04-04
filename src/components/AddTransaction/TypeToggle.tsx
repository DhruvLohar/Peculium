import React, { memo } from 'react';
import { View } from 'react-native';
import { type Control, Controller } from 'react-hook-form';
import Button from '@/components/atoms/Button';
import type { AddTransactionFormValues } from '@/utils/schemas';
import type { TransactionType } from '@/hooks/useTransactions';

interface TypeToggleProps {
  control: Control<AddTransactionFormValues>;
}

const TYPES: { value: TransactionType; label: string }[] = [
  { value: 'EXPENSE', label: 'EXPENSE' },
  { value: 'INCOME', label: 'INCOME' },
];

const TypeToggle: React.FC<TypeToggleProps> = ({ control }) => (
  <Controller
    control={control}
    name="type"
    render={({ field: { value, onChange } }) => (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {TYPES.map((t) => (
          <Button
            key={t.value}
            variant={value === t.value ? 'default' : 'outline'}
            size="md"
            className="w-[48%]"
            onPress={() => onChange(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </View>
    )}
  />
);

export default memo(TypeToggle);
