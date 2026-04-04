import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import CustomText from '@/components/atoms/CustomText';
import Button from '@/components/atoms/Button';
import FixedBottomSheet from '@/components/atoms/FixedBottomSheet';
import { useBottomSheet } from '@/hooks/useBottomSheet';

export const CONFIRM_TRANSACTION_DELETE_SHEET_ID = 'confirm-transaction-delete';

export interface ConfirmTransactionDeleteArgs {
  onConfirm: () => void;
}

const ConfirmTransactionDelete: React.FC<ConfirmTransactionDeleteArgs> = ({ onConfirm }) => {
  const { close } = useBottomSheet(CONFIRM_TRANSACTION_DELETE_SHEET_ID);

  const handleCancel = useCallback(() => {
    close();
  }, [close]);

  const handleDelete = useCallback(() => {
    onConfirm();
    close();
  }, [onConfirm, close]);

  return (
    <View className="px-5 py-4">
      {/* Header */}
      <View className="mb-5">
        <CustomText variant="h3" className="mb-2">
          Delete Transaction
        </CustomText>
        <CustomText variant="muted" className="text-base leading-5">
          Are you sure you want to delete this transaction? This action cannot be undone.
        </CustomText>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Button variant="outline" size="lg" onPress={handleCancel}>
            Cancel
          </Button>
        </View>
        <View className="flex-1">
          <Button variant="destructive" size="lg" onPress={handleDelete}>
            Delete
          </Button>
        </View>
      </View>
    </View>
  );
};

export default memo(ConfirmTransactionDelete);

// Self-contained sheet — mount anywhere, renders via portal above everything
export const ConfirmTransactionDeleteSheet = memo(() => (
  <FixedBottomSheet<ConfirmTransactionDeleteArgs> id={CONFIRM_TRANSACTION_DELETE_SHEET_ID} maxHeight={0.25}>
    {(args) => <ConfirmTransactionDelete {...args} />}
  </FixedBottomSheet>
));
