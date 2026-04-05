import React, { memo, useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CustomText from '@/components/atoms/CustomText';
import Slider from '@/components/atoms/Slider';
import { useMicroSpend } from '@/hooks/useMicroSpend';

const MIN = 100;
const MAX = 800;
const STEP = 100;
const DEFAULT = 100;

const AnalyzeMicroSpend: React.FC = () => {
  const [threshold, setThreshold] = useState(DEFAULT);
  const { bleedTxns, totalBleed } = useMicroSpend(threshold);

  const handleValueChange = useCallback((value: number) => {
    setThreshold(value);
  }, []);

  const formattedTotal = useMemo(
    () => totalBleed.toLocaleString('en-IN'),
    [totalBleed],
  );

  return (
    <View className="border-2 border-black bg-white" style={{ boxShadow: '4px 4px 0 0 #000' }}>

      {/* Section 1: Header */}
      <View className="bg-destructive/10 border-b-2 border-black px-4 py-3 flex-row items-center gap-3">
        <MaterialIcons name="warning" size={20} color="#000" />
        <CustomText variant="label" className="text-xs tracking-widest">
          MICRO SPEND BLEED
        </CustomText>
      </View>

      {/* Section 2: Shock data */}
      <View className="px-4 py-4 border-b-2 border-black">
        <CustomText variant="label" className="text-xs tracking-widest text-muted-foreground mb-1">
          {bleedTxns.length} TRANSACTIONS UNDER ₹{threshold}
        </CustomText>
        <CustomText variant="h1" className="leading-none" numberOfLines={1}>
          ₹{formattedTotal}
        </CustomText>
      </View>

      {/* Section 3: Swarm window */}
      <View className="px-3 py-3 bg-muted/10 border-b-2 border-black">
        <ScrollView
          style={{ height: 120 }}
          className="border-2 border-black bg-white p-2"
          scrollEnabled
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {bleedTxns.length === 0 ? (
            <View style={{ height: 104 }} className="items-center justify-center">
              <CustomText variant="muted" className="text-xs tracking-widest uppercase">
                No leaks detected
              </CustomText>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-1">
              {bleedTxns.map((_, i) => (
                <View
                  key={i}
                  style={{ width: 14, height: 14, boxShadow: '1px 1px 0 0 #000' }}
                  className="bg-destructive border border-black"
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Section 4: Slider control */}
      <View className="px-4 py-4 bg-primary">
        {/* Label row */}
        <View className="flex-row justify-between items-end mb-4">
          <CustomText variant="label" className="text-xs tracking-widest">
            SET LIMIT
          </CustomText>
          <View className="border-b-2 border-black pb-0.5">
            <CustomText variant="h4">₹{threshold}</CustomText>
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

        {/* Min / Max labels */}
        <View className="flex-row justify-between mt-2">
          <CustomText variant="label" className="text-xs opacity-60">
            ₹{MIN}
          </CustomText>
          <CustomText variant="label" className="text-xs opacity-60">
            ₹{MAX}
          </CustomText>
        </View>
      </View>

    </View>
  );
};

export default memo(AnalyzeMicroSpend);
