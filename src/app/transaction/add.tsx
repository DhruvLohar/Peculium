import React, { memo } from 'react';
import { View } from 'react-native';
import { Container } from '@/components/Container';
import ScreenHeader from '@/components/ScreenHeader';
import CustomText from '@/components/atoms/CustomText';

const AddTransactionScreen: React.FC = () => {
  return (
    <Container>
      <ScreenHeader 
        title="Add Transaction" 
        subtitle="Track your income and expenses"
      />
      
      <View className="flex-1 items-center justify-center">
        <CustomText variant="h1">
          Hello World
        </CustomText>
      </View>
    </Container>
  );
};

export default memo(AddTransactionScreen);
