import React, { memo } from 'react';
import { View } from 'react-native';
import { Container } from '../../components/Container';
import CustomText from '../../components/atoms/CustomText';

const Home: React.FC = () => {
  return (
    <Container>
      <View className="items-center justify-center flex-1">
        <CustomText variant="h1" className="font-bold mb-2">
          Welcome to Peculium
        </CustomText>
        <CustomText variant="muted" className="text-center">
          Manage your finances with ease
        </CustomText>
      </View>
    </Container>
  );
};

export default memo(Home);
