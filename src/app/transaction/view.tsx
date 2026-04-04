import React, { memo } from 'react';
import { View } from 'react-native';
import { Container } from '@/components/Container';
import CustomText from '@/components/atoms/CustomText';

const ViewTransactionScreen: React.FC = () => {
  return (
    <Container>
      <View className="flex-1 items-center justify-center">
        <CustomText variant="h1">
          Hello World
        </CustomText>
      </View>
    </Container>
  );
};

export default memo(ViewTransactionScreen);
