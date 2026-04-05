import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import CustomText from '@/components/atoms/CustomText';
import Button from '@/components/atoms/Button';
import AmountInput from '@/components/atoms/AmountInput';
import FixedBottomSheet from '@/components/atoms/FixedBottomSheet';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { useMonthlyBudget } from '@/hooks/useMonthlyBudget';
import { budgetSchema, type BudgetFormValues } from '@/utils/schemas';

export const EDIT_MONTHLY_BUDGET_SHEET_ID = 'edit-monthly-budget';

export interface EditMonthlyBudgetArgs extends Record<string, unknown> {
  currentAmount: number;
}

const EditMonthlyBudget: React.FC<EditMonthlyBudgetArgs> = ({ currentAmount }) => {
  const { close } = useBottomSheet(EDIT_MONTHLY_BUDGET_SHEET_ID);
  const { upsertBudget } = useMonthlyBudget();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema) as any,
    defaultValues: {
      amount: currentAmount || 0,
    },
  });

  const handleCancel = useCallback(() => {
    close();
  }, [close]);

  const onSubmit = useCallback(
    async (data: BudgetFormValues) => {
      await upsertBudget.mutateAsync(data.amount);
      close();
    },
    [upsertBudget, close],
  );

  return (
    <View className="px-5 py-4">
      {/* Header */}
      <View className="mb-5">
        <CustomText variant="h3" className="mb-2">
          Set Monthly Budget
        </CustomText>
        <CustomText variant="muted" className="text-base leading-5">
          Enter your total monthly spending limit to track your budget.
        </CustomText>
      </View>

      {/* Form */}
      <View className="gap-4 mb-5">
        <View>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, value } }) => (
              <AmountInput
                value={value?.toString() || ''}
                onChangeText={(text) => onChange(text ? Number(text) : 0)}
                isInvalid={!!errors.amount}
              />
            )}
          />
          {errors.amount && (
            <CustomText variant="muted" className="text-xs text-destructive mt-1">
              {errors.amount.message}
            </CustomText>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Button variant="outline" size="lg" onPress={handleCancel}>
            Cancel
          </Button>
        </View>
        <View className="flex-1">
          <Button
            variant="default"
            size="lg"
            onPress={handleSubmit(onSubmit) as any}
            disabled={upsertBudget.isPending}
          >
            {upsertBudget.isPending ? 'Saving...' : 'Save'}
          </Button>
        </View>
      </View>
    </View>
  );
};

export default memo(EditMonthlyBudget);

// Self-contained sheet — mount anywhere, renders via portal above everything
export const EditMonthlyBudgetSheet = memo(() => (
  <FixedBottomSheet<EditMonthlyBudgetArgs> id={EDIT_MONTHLY_BUDGET_SHEET_ID} maxHeight={0.4}>
    {(args) => <EditMonthlyBudget {...args} />}
  </FixedBottomSheet>
));
