import React, { memo, useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
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
import { addTransactionSchema, type AddTransactionFormValues } from '@/utils/schemas';
import { useAddTransaction } from '@/hooks/useTransactions';

const AddTransactionScreen: React.FC = () => {
  const router = useRouter();
  const { mutate: addTransaction, isPending, error } = useAddTransaction();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddTransactionFormValues>({
    resolver: zodResolver(addTransactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      amount: undefined as unknown as number,
      category: undefined as unknown as AddTransactionFormValues['category'],
      transaction_date: new Date().toISOString(),
      notes: '',
    },
  });

  const onSubmit = useCallback(
    (values: AddTransactionFormValues) => {
      addTransaction(
        {
          amount: values.amount,
          type: values.type,
          category: values.category,
          notes: values.notes || undefined,
          transaction_date: new Date(values.transaction_date).toISOString(),
        },
        { onSuccess: () => router.back() },
      );
    },
    [addTransaction, router],
  );

  return (
    <Container>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Add Transaction" subtitle="Track your income and expenses" />

        {/* Type Toggle */}
        <TypeToggle control={control} />

        {/* Amount */}
        <View className="mt-8 mb-2">
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
            <CustomText className="text-xs text-destructive mt-1">
              {errors.amount.message}
            </CustomText>
          ) : (
            <CustomText variant="muted" className="text-[11px] tracking-[1px] mt-1.5">
              ENTER TRANSACTION AMOUNT
            </CustomText>
          )}
        </View>

        {/* Category */}
        <View className="mt-6 mb-2">
          <Label className="mb-3">SELECT CATEGORY</Label>
          <CategoryGrid control={control} />
          {errors.category && (
            <CustomText className="text-xs text-destructive mt-1.5">
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
          <CustomText className="text-xs text-destructive mt-2">
            {error.message}
          </CustomText>
        )}

        {/* Submit */}
        <View className="mt-8 mb-10">
          <Button size="lg" variant="default" onPress={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Transaction'}
          </Button>
        </View>
      </ScrollView>
    </Container>
  );
};

export default memo(AddTransactionScreen);
