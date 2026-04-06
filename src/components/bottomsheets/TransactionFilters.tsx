import React, { memo, useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import CustomText from '@/components/atoms/CustomText';
import Button from '@/components/atoms/Button';
import FixedBottomSheet from '@/components/atoms/FixedBottomSheet';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { Constants } from '@/utils/database.types';
import { getThemeColors } from '@/utils/themeColors';
import type { TransactionCategory, TransactionType } from '@/hooks/useTransactions';

export const TRANSACTION_FILTERS_SHEET_ID = 'transaction-filters';

export interface TransactionFilterArgs {
  onApply: (filters: { type: TransactionType | null; categories: TransactionCategory[] }) => void;
  currentType?: TransactionType | null;
  currentCategories?: TransactionCategory[];
}

// ─── Chip ────────────────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const Chip: React.FC<ChipProps> = memo(({ label, selected, onPress }) => {
  const { colorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const unselectedBg = colorScheme === 'dark' ? '#242424' : '#ffffff';

  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderWidth: 2,
        borderColor: colors.border,
        backgroundColor: selected ? colors.border : unselectedBg,
        boxShadow: selected ? `2px 2px 0px ${colors.border}` : undefined,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <CustomText
        style={{
          fontWeight: '600',
          fontSize: 13,
          color: selected ? (colorScheme === 'dark' ? '#1a1a1a' : 'white') : colors.foreground,
        }}
      >
        {label}
      </CustomText>
    </Pressable>
  );
});

// ─── Section Label ────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ children: string }> = memo(({ children }) => {
  const { colorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');

  return (
    <CustomText
      style={{
        fontWeight: '700',
        fontSize: 11,
        letterSpacing: 1.2,
        marginBottom: 10,
        color: colors.muted,
      }}
    >
      {children.toUpperCase()}
    </CustomText>
  );
});

// ─── Main Content ─────────────────────────────────────────────────────────────

const TYPES: TransactionType[] = ['INCOME', 'EXPENSE'];
const CATEGORIES = Constants.public.Enums.transaction_category as TransactionCategory[];

const TransactionFilters: React.FC<TransactionFilterArgs> = ({
  onApply,
  currentType = null,
  currentCategories = [],
}) => {
  const { close } = useBottomSheet(TRANSACTION_FILTERS_SHEET_ID);
  const [selectedType, setSelectedType] = useState<TransactionType | null>(currentType);
  const [selectedCategories, setSelectedCategories] = useState<TransactionCategory[]>(currentCategories);

  const toggleType = useCallback((type: TransactionType) => {
    setSelectedType((prev) => (prev === type ? null : type));
  }, []);

  const toggleCategory = useCallback((cat: TransactionCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }, []);

  const handleClear = useCallback(() => {
    setSelectedType(null);
    setSelectedCategories([]);
  }, []);

  const handleApply = useCallback(() => {
    onApply({ type: selectedType, categories: selectedCategories });
    close();
  }, [onApply, close, selectedType, selectedCategories]);

  return (
    <View style={{ flex: 1, paddingHorizontal: 20 }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Type */}
        <View style={{ marginBottom: 24 }}>
          <SectionLabel>Type</SectionLabel>
          <View style={{ flexDirection: 'row' }}>
            {TYPES.map((type) => (
              <Chip
                key={type}
                label={type}
                selected={selectedType === type}
                onPress={() => toggleType(type)}
              />
            ))}
          </View>
        </View>

        {/* Category */}
        <View style={{ marginBottom: 24 }}>
          <SectionLabel>Category</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                selected={selectedCategories.includes(cat)}
                onPress={() => toggleCategory(cat)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 10, paddingBottom: 20, paddingTop: 8 }}>
        <Button variant="outline" size="md" className="flex-1" onPress={handleClear}>
          Clear
        </Button>
        <Button variant="default" size="md" className="flex-1" onPress={handleApply}>
          Apply
        </Button>
      </View>
    </View>
  );
};

export default memo(TransactionFilters);

// Self-contained sheet — mount anywhere, renders via portal above everything
export const TransactionFiltersSheet = memo(() => (
  <FixedBottomSheet<TransactionFilterArgs> id={TRANSACTION_FILTERS_SHEET_ID}>
    {(args) => <TransactionFilters {...args} />}
  </FixedBottomSheet>
));
