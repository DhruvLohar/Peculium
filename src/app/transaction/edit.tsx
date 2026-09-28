import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { ScrollView, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
import Loader from '@/components/atoms/Loader';
import TypeToggle from '@/components/AddTransaction/TypeToggle';
import CategoryGrid from '@/components/AddTransaction/CategoryGrid';
import {
  addTransactionSchema,
  type AddTransactionFormValues,
  type AddTransactionFormOutput,
} from '@/utils/schemas';
import {
  useTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/hooks/useTransactions';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useUpdateStreak } from '@/hooks/useStreak';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import {
  CONFIRM_TRANSACTION_DELETE_SHEET_ID,
  ConfirmTransactionDeleteSheet,
  type ConfirmTransactionDeleteArgs,
} from '@/components/bottomsheets/ConfirmTransactionDelete';

const EditTransactionScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: transaction, isLoading } = useTransaction(id ?? null);
  const {
    mutate: updateTransaction,
    isPending: isUpdating,
    error: updateError,
  } = useUpdateTransaction();
  const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteTransaction();
  const { mutate: updateStreak } = useUpdateStreak();
  const { trackEditTransaction, trackDeleteTransaction } = useAnalytics();
  const { open: openDeleteConfirm } = useBottomSheet<ConfirmTransactionDeleteArgs>(
    CONFIRM_TRANSACTION_DELETE_SHEET_ID
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddTransactionFormValues, unknown, AddTransactionFormOutput>({
    resolver: zodResolver(addTransactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      amount: undefined as unknown as number,
      category: undefined as unknown as AddTransactionFormValues['category'],
      transaction_date: '',
      notes: '',
    },
  });

  // Prefill form when transaction data loads
  useEffect(() => {
    if (transaction) {
      reset({
        type: transaction.type,
        amount: transaction.amount,
        // SMS drafts have no category yet; leave it unset so the user must pick one
        category: (transaction.category ?? undefined) as AddTransactionFormValues['category'],
        transaction_date: transaction.transaction_date,
        notes: transaction.notes ?? '',
      });
    }
  }, [transaction, reset]);

  const currentType = useWatch({ control, name: 'type' });

  const isDraft = transaction?.status === 'PENDING_REVIEW';

  const header = useMemo(
    () =>
      isDraft
        ? { title: 'Review Transaction', subtitle: 'Pick a category to confirm this SMS capture' }
        : { title: 'Edit Transaction', subtitle: 'Update or delete your transaction' },
    [isDraft]
  );

  const onUpdate = useCallback(
    (values: AddTransactionFormOutput) => {
      if (!id) return;

      updateTransaction(
        {
          id,
          amount: values.amount,
          type: values.type,
          category: values.category,
          notes: values.notes || undefined,
          transaction_date: new Date(values.transaction_date).toISOString(),
        },
        {
          onSuccess: () => {
            trackEditTransaction({
              transaction_id: id,
              type: values.type,
              category: values.category,
              amount: values.amount,
            });
            // Confirming a draft counts as logging a transaction
            if (isDraft) updateStreak();
            router.back();
          },
        }
      );
    },
    [id, updateTransaction, router, trackEditTransaction, isDraft, updateStreak]
  );

  const onDelete = useCallback(() => {
    if (!id) return;

    openDeleteConfirm({
      onConfirm: () => {
        trackDeleteTransaction(id);
        deleteTransaction(id, { onSuccess: () => router.back() });
      },
    });
  }, [id, openDeleteConfirm, deleteTransaction, router, trackDeleteTransaction]);

  if (isLoading) {
    return (
      <Container>
        <Loader />
      </Container>
    );
  }

  if (!transaction) {
    return (
      <Container>
        <View className="flex-1 items-center justify-center">
          <CustomText variant="h2" className="text-destructive">
            Transaction not found
          </CustomText>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <ScreenHeader title={header.title} subtitle={header.subtitle} />

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

          {/* Action Buttons */}
          <View className="mb-10 mt-8 gap-3">
            <View className="flex-row gap-3">
              <View className="w-[48%]">
                <Button
                  size="lg"
                  variant="destructive"
                  onPress={onDelete}
                  disabled={isUpdating || isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </View>
              <View className="w-[48%]">
                <Button
                  size="lg"
                  variant="default"
                  onPress={handleSubmit(onUpdate)}
                  disabled={isUpdating || isDeleting}>
                  {isUpdating ? 'Saving...' : isDraft ? 'Confirm' : 'Update'}
                </Button>
              </View>
            </View>
            {updateError && (
              <CustomText variant="muted" className="text-destructive">
                Couldn&apos;t save: {updateError.message}
              </CustomText>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Delete Confirmation Bottom Sheet */}
      <ConfirmTransactionDeleteSheet />
    </Container>
  );
};

export default memo(EditTransactionScreen);
