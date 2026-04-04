import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import { Container } from '@/components/Container';
import CustomText from '@/components/atoms/CustomText';
import { useUser } from '@/hooks/useUser';

const Home: React.FC = () => {
  const { data: user } = useUser();

  const displayName = useMemo(
    () => (user?.user_metadata?.display_name as string | undefined) ?? '',
    [user],
  );

  return (
    <Container>
      <View className="items-start justify-start pt-8">
        <CustomText variant="h2" className="mb-2">
          Good Morning,{"\n"}
          <CustomText variant="h2">
            {displayName}
          </CustomText>
        </CustomText>
      </View>
    </Container>
  );
};

export default memo(Home);
