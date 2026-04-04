import React, { memo } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { type Control, Controller } from 'react-hook-form';
import CustomText from '@/components/atoms/CustomText';
import type { AddTransactionFormValues } from '@/utils/schemas';
import { CATEGORY_LIST } from '@/utils/categoryConfig';

interface CategoryGridProps {
  control: Control<AddTransactionFormValues>;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_SIZE = Math.floor((SCREEN_WIDTH - 32 - 24) / 4);

const CategoryGrid: React.FC<CategoryGridProps> = ({ control }) => (
  <Controller
    control={control}
    name="category"
    render={({ field: { value, onChange } }) => (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CATEGORY_LIST.map((cat) => {
          const selected = value === cat.value;
          return (
            <Pressable
              key={cat.value}
              onPress={() => onChange(cat.value)}
              style={{
                width: TILE_SIZE,
                height: TILE_SIZE,
                borderWidth: 2,
                borderColor: '#000',
                backgroundColor: selected ? '#ffdb33' : '#fff',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <MaterialIcons
                name={cat.icon as any}
                size={24}
                color={selected ? '#000' : '#5a5a5a'}
              />
              <CustomText
                style={{
                  fontSize: 9,
                  fontWeight: '700',
                  letterSpacing: 0.5,
                  color: selected ? '#000' : '#5a5a5a',
                  textAlign: 'center',
                }}
              >
                {cat.label}
              </CustomText>
            </Pressable>
          );
        })}
      </View>
    )}
  />
);

export default memo(CategoryGrid);
