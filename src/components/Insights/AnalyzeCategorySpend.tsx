import React, { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import CustomText from '@/components/atoms/CustomText';
import { useAnalyzeCategorySpend } from '@/hooks/useAnalyzeCategorySpend';
import { getThemeColors } from '@/utils/themeColors';

const TREEMAP_HEIGHT = 260;

const AnalyzeCategorySpend: React.FC = () => {
  const { blocks, isLoading } = useAnalyzeCategorySpend();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { colorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const isDark = colorScheme === 'dark';

  const effectiveCategory = selectedCategory ?? blocks[0]?.category ?? null;

  const selectedBlock = useMemo(
    () => blocks.find((b) => b.category === effectiveCategory) ?? blocks[0] ?? null,
    [blocks, effectiveCategory],
  );

  const formattedAmount = useMemo(
    () => selectedBlock?.amount.toLocaleString('en-IN') ?? '0',
    [selectedBlock],
  );

  const handleSelect = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  return (
    <View
      className="border border-border bg-card pr-1"
      style={{ boxShadow: `4px 4px 0 0 ${colors.border}` }}
    >
      {/* Header */}
      <View
        className="border-b border-border px-4 py-3 flex-row items-center justify-between"
        // style={{ backgroundColor: isDark ? '#2e1065' : '#e9d5ff' }}
      >
        <View className="flex-row items-center gap-3">
          <MaterialIcons name="apps" size={20} color={colors.foreground} />
          <CustomText variant="label" className="text-xs tracking-widest">
            WHERE MONEY GOES?
          </CustomText>
        </View>
      </View>

      {/* Treemap grid */}
      <View
        style={{ height: TREEMAP_HEIGHT, position: 'relative', overflow: 'hidden' }}
        className="border-b border-border bg-zinc-900"
      >
        {isLoading || blocks.length === 0 ? (
          <View style={{ flex: 1 }} className="items-center justify-center">
            <CustomText
              style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#71717a' }}
            >
              {isLoading ? 'LOADING...' : 'NO EXPENSE DATA THIS MONTH'}
            </CustomText>
          </View>
        ) : (
          blocks.map((block) => {
            const isSelected = block.category === effectiveCategory;
            const showFull = block.width > 15 && block.height > 20;
            const showPercent = !showFull && block.width > 8 && block.height > 10;

            return (
              <Pressable
                key={block.category}
                onPress={() => handleSelect(block.category)}
                style={{
                  position: 'absolute',
                  left: `${block.x}%`,
                  top: `${block.y}%`,
                  width: `${block.width}%`,
                  height: `${block.height}%`,
                  backgroundColor: block.color,
                  borderWidth: isSelected ? 3 : 1.5,
                  borderColor: isSelected ? '#ffffff' : '#000000',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                  zIndex: isSelected ? 10 : 1,
                }}
              >
                {showFull && (
                  <>
                    <CustomText
                      style={{
                        fontSize: 14,
                        fontWeight: '900',
                        color: '#000',
                        lineHeight: 16,
                        textAlign: 'center',
                      }}
                    >
                      {block.percentage}%
                    </CustomText>
                    <CustomText
                      numberOfLines={1}
                      style={{
                        fontSize: 9,
                        fontWeight: '700',
                        color: '#000',
                        letterSpacing: 0.5,
                        textAlign: 'center',
                      }}
                    >
                      {block.label}
                    </CustomText>
                  </>
                )}
                {showPercent && (
                  <CustomText style={{ fontSize: 10, fontWeight: '900', color: '#000' }}>
                    {block.percentage}%
                  </CustomText>
                )}
              </Pressable>
            );
          })
        )}
      </View>

      {/* Terminal readout — always dark */}
      {selectedBlock && (
        <View style={{ backgroundColor: '#111111', padding: 16 }}>
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <CustomText
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 2,
                  color: '#71717a',
                  marginBottom: 4,
                }}
              >
                SELECTED CATEGORY
              </CustomText>
              <View className="flex-row items-center gap-2">
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderWidth: 1.5,
                    borderColor: '#ffffff',
                    backgroundColor: selectedBlock.color,
                  }}
                />
                <CustomText
                  numberOfLines={1}
                  style={{
                    fontSize: 18,
                    fontWeight: '900',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    letterSpacing: -0.5,
                    maxWidth: 180,
                  }}
                >
                  {selectedBlock.label}
                </CustomText>
              </View>
            </View>

            <View className="items-end">
              <CustomText
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 2,
                  color: '#71717a',
                  marginBottom: 4,
                }}
              >
                AREA WEIGHT
              </CustomText>
              <CustomText style={{ fontSize: 22, fontWeight: '900', color: '#ffffff' }}>
                {selectedBlock.percentage}%
              </CustomText>
            </View>
          </View>

          <View
            style={{
              borderTopWidth: 1.5,
              borderTopColor: '#3f3f46',
              paddingTop: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            <CustomText
              style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#71717a' }}
            >
              ALLOCATED FUNDS
            </CustomText>
            <CustomText
              style={{ fontSize: 28, fontWeight: '900', color: '#ffffff', letterSpacing: -1 }}
            >
              ₹{formattedAmount}
            </CustomText>
          </View>
        </View>
      )}
    </View>
  );
};

export default memo(AnalyzeCategorySpend);
