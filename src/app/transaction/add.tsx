import React, { memo, useCallback } from 'react';
import { ScrollView, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Container } from '@/components/Container';
import ScreenHeader from '@/components/ScreenHeader';
import AmountInput from '@/components/atoms/AmountInput';
import Input from '@/components/atoms/Input';
import Label from '@/components/atoms/Label';
import DateTimeInput from '@/components/atoms/DateTimeInput';
import Button from '@/components/atoms/Button';
import CustomText from '@/components/atoms/CustomText';
import TypeToggle from '@/components/AddTransaction/TypeToggle';
import CategoryGrid from '@/components/AddTransaction/CategoryGrid';
import {
  addTransactionSchema,
  type AddTransactionFormValues,
  type AddTransactionFormOutput,
} from '@/utils/schemas';
import { useAddTransaction } from '@/hooks/useTransactions';
import { useUpdateStreak } from '@/hooks/useStreak';
import { useAnalytics } from '@/hooks/useAnalytics';

const AddTransactionScreen: React.FC = () => {
  const router = useRouter();
  const { mutate: addTransaction, isPending, error } = useAddTransaction();
  const { mutate: updateStreak } = useUpdateStreak();
  const { trackAddTransaction } = useAnalytics();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddTransactionFormValues, unknown, AddTransactionFormOutput>({
    resolver: zodResolver(addTransactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      amount: undefined as unknown as number,
      category: undefined as unknown as AddTransactionFormValues['category'],
      transaction_date: new Date().toISOString(),
      notes: '',
    },
  });

  const currentType = useWatch({ control, name: 'type' });

  const onSubmit = useCallback(
    (values: AddTransactionFormOutput) => {
      addTransaction(
        {
          amount: values.amount,
          type: values.type,
          category: values.category,
          notes: values.notes || undefined,
          transaction_date: new Date(values.transaction_date).toISOString(),
        },
        {
          onSuccess: () => {
            trackAddTransaction({
              type: values.type,
              category: values.category,
              amount: values.amount,
            });
            updateStreak();
            router.back();
          },
        }
      );
    },
    [addTransaction, router, updateStreak, trackAddTransaction]
  );

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <ScreenHeader title="Add Transaction" subtitle="Track your income and expenses" />

          {/* Type Toggle */}
          <TypeToggle control={control} />

          {/* Amount */}
          <View className="mb-2 mt-8">
            <Controller
              control={control}
              name="amount"
              render={({ field: { value, onChange, onBlur } }) => (
                <AmountInput
                  value={value ? String(value) : ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  isInvalid={!!errors.amount}
                />
              )}
            />
            {errors.amount ? (
              <CustomText className="mt-1 text-xs text-destructive">
                {errors.amount.message}
              </CustomText>
            ) : (
              <CustomText variant="muted" className="mt-1.5 text-[11px] tracking-[1px]">
                ENTER TRANSACTION AMOUNT
              </CustomText>
            )}
          </View>

          {/* Category */}
          <View className="mb-2 mt-6">
            <Label className="mb-3">SELECT CATEGORY</Label>
            <CategoryGrid control={control} type={currentType} />
            {errors.category && (
              <CustomText className="mt-1.5 text-xs text-destructive">
                {errors.category.message}
              </CustomText>
            )}
          </View>

          {/* Date & Time */}
          <View className="mt-6">
            <Controller
              control={control}
              name="transaction_date"
              render={({ field: { value, onChange } }) => (
                <DateTimeInput
                  label="DATE & TIME"
                  value={value}
                  onChange={onChange}
                  isInvalid={!!errors.transaction_date}
                  errorMessage={errors.transaction_date?.message}
                />
              )}
            />
          </View>

          {/* Notes */}
          <View className="mt-4 gap-3">
            <Label>NOTES</Label>
            <Controller
              control={control}
              name="notes"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Optional description..."
                  multiline
                  numberOfLines={3}
                  className="h-20 pt-3"
                  style={{ textAlignVertical: 'top' }}
                />
              )}
            />
          </View>

          {/* Error from mutation */}
          {error && (
            <CustomText className="mt-2 text-xs text-destructive">{error.message}</CustomText>
          )}

          {/* Submit */}
          <View className="mb-10 mt-8">
            <Button
              size="lg"
              variant="default"
              onPress={handleSubmit(onSubmit)}
              disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Transaction'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default memo(AddTransactionScreen);
