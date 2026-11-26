import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useAppDimensions } from '@/hooks/useAppDimensions';
import { MaterialIcons } from '@expo/vector-icons';
import { type Control, Controller } from 'react-hook-form';
import { useColorScheme } from 'nativewind';
import CustomText from '@/components/atoms/CustomText';
import type { AddTransactionFormValues } from '@/utils/schemas';
import { getCategoriesByType } from '@/utils/categoryConfig';
import { getThemeColors } from '@/utils/themeColors';
import type { TransactionType } from '@/hooks/useTransactions';

interface CategoryGridProps {
  control: Control<AddTransactionFormValues>;
  type?: TransactionType;
}


const CategoryGrid: React.FC<CategoryGridProps> = ({ control, type }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);
  const unselectedBg = isDark ? '#242424' : '#ffffff';
  const unselectedFg = isDark ? '#888888' : '#5a5a5a';
  const { width } = useAppDimensions();
  // 4 tiles per row: 16px screen padding each side, 8px gap x3
  const TILE_SIZE = useMemo(() => Math.floor((width - 32 - 24) / 4), [width]);

  const filteredCategories = useMemo(() => {
    return type ? getCategoriesByType(type) : [];
  }, [type]);

  return (
    <Controller
      control={control}
      name="category"
      render={({ field: { value, onChange } }) => (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {filteredCategories.map((cat) => {
            const selected = value === cat.value;
            return (
              <Pressable
                key={cat.value}
                onPress={() => onChange(cat.value)}
                style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  borderWidth: 2,
                  borderColor: colors.border,
                  backgroundColor: selected ? '#ffdb33' : unselectedBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}>
                <MaterialIcons
                  name={cat.icon as any}
                  size={24}
                  color={selected ? '#000' : unselectedFg}
                />
                <CustomText
                  style={{
                    fontSize: 9,
                    fontWeight: '700',
                    letterSpacing: 0.5,
                    color: selected ? '#000' : unselectedFg,
                    textAlign: 'center',
                  }}>
                  {cat.label}
                </CustomText>
              </Pressable>
            );
          })}
        </View>
      )}
    />
  );
};

export default memo(CategoryGrid);
