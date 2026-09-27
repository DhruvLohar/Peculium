import React, { memo, useCallback, useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import CustomText from '@/components/atoms/CustomText';
import Slider from '@/components/atoms/Slider';
import { useMicroSpend } from '@/hooks/useMicroSpend';
import { getThemeColors } from '@/utils/themeColors';
import { CATEGORY_CONFIG } from '@/utils/categoryConfig';
import type { Database } from '@/utils/database.types';

type TransactionCategory = Database['public']['Enums']['transaction_category'];

const MIN = 100;
const MAX = 800;
const STEP = 100;
const DEFAULT = 100;

const AnalyzeMicroSpend: React.FC = () => {
  const [threshold, setThreshold] = useState(DEFAULT);
  const { bleedTxns, totalBleed } = useMicroSpend(threshold);
  const { colorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const router = useRouter();

  const handleValueChange = useCallback((value: number) => {
    setThreshold(value);
  }, []);

  const handleCardPress = useCallback(
    (id: string) => {
      router.push(`/transaction/edit?id=${id}`);
    },
    [router]
  );

  const formattedTotal = useMemo(() => totalBleed.toLocaleString('en-IN'), [totalBleed]);

  return (
    <View
      className="border-2 border-border bg-card"
      style={{ boxShadow: `4px 4px 0 0 ${colors.border}` }}>
      {/* Header */}
      <View className="bg-destructive/10 flex-row items-center gap-3 border-b-2 border-border px-4 py-3">
        <MaterialIcons name="warning" size={20} color={colors.foreground} />
        <CustomText variant="label" className="text-xs tracking-widest">
          MICRO SPEND BLEED
        </CustomText>
      </View>

      {/* Shock data */}
      <View className="border-b-2 border-border px-4 py-4">
        <CustomText variant="label" className="mb-1 text-xs tracking-widest text-muted-foreground">
          {bleedTxns.length} TRANSACTIONS UNDER ₹{threshold}
        </CustomText>
        <CustomText variant="h1" className="leading-none" numberOfLines={1}>
          ₹{formattedTotal}
        </CustomText>
      </View>

      {/* Swarm window */}
      <View className="bg-muted/10 border-b-2 border-border px-3 py-3">
        <ScrollView
          style={{ height: 120 }}
          className="border-2 border-border bg-background p-2"
          scrollEnabled
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled>
          {bleedTxns.length === 0 ? (
            <View style={{ height: 104 }} className="items-center justify-center">
              <CustomText variant="muted" className="text-xs uppercase tracking-widest">
                No leaks detected
              </CustomText>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-1">
              {bleedTxns.map((txn) => {
                const config =
                  CATEGORY_CONFIG[txn.category as TransactionCategory] ?? CATEGORY_CONFIG.Other;
                return (
                  <TouchableOpacity
                    key={txn.id}
                    onPress={() => handleCardPress(txn.id)}
                    activeOpacity={0.7}
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: config.bg,
                      boxShadow: `1px 1px 0 0 ${colors.border}`,
                    }}
                    className="items-center justify-center border border-border">
                    <MaterialIcons name={config.icon as any} size={14} color="#fff" />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Slider control */}
      <View className="bg-primary px-4 py-4">
        <View className="mb-4 flex-row items-end justify-between">
          <CustomText variant="label" className="text-xs tracking-widest" darkInvert>
            SET LIMIT
          </CustomText>
          <View className="border-b-2 border-primary-foreground pb-0.5">
            <CustomText variant="h4" darkInvert>
              ₹{threshold}
            </CustomText>
          </View>
        </View>

        <Slider
          value={threshold}
          min={MIN}
          max={MAX}
          step={STEP}
          onValueChange={handleValueChange}
          rangeClassName="bg-secondary"
        />

        <View className="mt-2 flex-row justify-between">
          <CustomText variant="label" className="text-xs opacity-60" darkInvert>
            ₹{MIN}
          </CustomText>
          <CustomText variant="label" className="text-xs opacity-60" darkInvert>
            ₹{MAX}
          </CustomText>
        </View>
      </View>
    </View>
  );
};

export default memo(AnalyzeMicroSpend);
