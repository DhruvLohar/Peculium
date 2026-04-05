import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import CustomText from '@/components/atoms/CustomText';

interface DashboardCardsProps {
  balance: number;
  income: number;
  expense: number;
}

function formatAmount(n: number): string {
  return '₹' + Math.abs(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const DashboardCards: React.FC<DashboardCardsProps> = ({ balance, income, expense }) => {
  const balanceStr = useMemo(() => formatAmount(balance), [balance]);
  const incomeStr = useMemo(() => formatAmount(income), [income]);
  const expenseStr = useMemo(() => formatAmount(expense), [expense]);

  return (
    <View className="flex-row gap-3" style={{ height: 260 }}>

      {/* Left — Balance */}
      <View className="flex-1 border-2 border-black bg-background p-4 justify-between">
        {/* Decorative accent block */}
        <View className="flex-1 bg-primary mb-4" />
        <View>
          <CustomText className="text-[11px] font-bold tracking-[1.5px] text-muted-foreground">
            BALANCE
          </CustomText>
          <CustomText variant="h2" className="mt-0.5">
            {balanceStr}
          </CustomText>
        </View>
      </View>

      {/* Right column */}
      <View className="flex-1 gap-3">

        {/* Income */}
        <View className="flex-1 border-2 border-black bg-background p-4">
          <View className="flex-row justify-between items-start">
            <CustomText className="text-[11px] font-bold tracking-[1.5px] text-muted-foreground">
              INCOME
            </CustomText>
            <View className="w-5 h-5 bg-green-500" />
          </View>
          <CustomText variant="h3" className="mt-2">
            {incomeStr}
          </CustomText>
        </View>

        {/* Expense */}
        <View className="flex-1 border-2 border-black bg-background p-4">
          <View className="flex-row justify-between items-start">
            <CustomText className="text-[11px] font-bold tracking-[1.5px] text-muted-foreground">
              EXPENSE
            </CustomText>
            <View className="w-5 h-5 bg-destructive" />
          </View>
          <CustomText variant="h3" className="mt-2">
            {expenseStr}
          </CustomText>
        </View>

      </View>
    </View>
  );
};

export default memo(DashboardCards);
