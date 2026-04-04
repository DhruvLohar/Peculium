import React, { memo } from 'react';
import { View } from 'react-native';
import { Container } from '@/components/Container';
import CustomText from '@/components/atoms/CustomText';

const InsightsScreen: React.FC = () => {
  return (
    <Container>
      <View className="items-start justify-start pt-8">
        <CustomText variant="h2">
          Insights
        </CustomText>
        <CustomText variant="muted" className="text-center">
          Don't trip over your finances. YOU DID IT.
        </CustomText>
      </View>
    </Container>
  );
};

export default memo(InsightsScreen);
