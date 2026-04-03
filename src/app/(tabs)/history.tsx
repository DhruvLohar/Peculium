import React, { memo } from 'react';
import { View } from 'react-native';
import { Container } from '../../components/Container';
import CustomText from '../../components/atoms/CustomText';

const HistoryScreen: React.FC = () => {
  return (
    <Container>
      <View className="items-center justify-center flex-1">
        <CustomText variant="h1" className="font-bold mb-2">
          History
        </CustomText>
        <CustomText variant="muted" className="text-center">
          View your transaction history
        </CustomText>
      </View>
    </Container>
  );
};

export default memo(HistoryScreen);
