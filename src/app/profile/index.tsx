import React, { memo, useCallback } from 'react';
import { View, ScrollView } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { Container } from '@/components/Container';
import ScreenHeader from '@/components/ScreenHeader';
import CustomText from '@/components/atoms/CustomText';
import Button from '@/components/atoms/Button';
import Switch from '@/components/atoms/Switch';
import { useUser } from '@/hooks/useUser';
import { useThemeContext } from '@/components/providers/ThemeProvider';
import { getThemeColors } from '@/utils/themeColors';
import supabase from '@/utils/supabase';

const ProfileScreen: React.FC = () => {
  const { data: user } = useUser();
  const { isDark, toggleTheme } = useThemeContext();
  const { colorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const router = useRouter();

  const displayName = (user?.user_metadata?.display_name as string | undefined) ?? '';
  const email = user?.email ?? '';
  const initial = displayName[0]?.toUpperCase() ?? '?';

  const logout = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      router.replace('/(auth)');
    },
  });

  const handleToggleTheme = useCallback(
    (_val: boolean) => {
      void toggleTheme();
    },
    [toggleTheme],
  );

  const handleLogout = useCallback(() => {
    logout.mutate();
  }, [logout]);

  return (
    <Container>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Profile" subtitle="Manage your account" />

        {/* Avatar */}
        <View className="items-center mt-4 mb-8">
          <View
            className="w-20 h-20 bg-primary border-2 border-border items-center justify-center"
            style={{ boxShadow: `4px 4px 0 0 ${colors.border}` }}
          >
            <CustomText variant="h2" className="leading-none" darkInvert>
              {initial}
            </CustomText>
          </View>
          <CustomText variant="h3" className="mt-4">
            {displayName}
          </CustomText>
          <CustomText variant="muted" className="mt-1">
            {email}
          </CustomText>
        </View>

        {/* Settings */}
        <View className="gap-4 mr-1">
          <CustomText variant="label" className="text-xs tracking-widest">
            PREFERENCES
          </CustomText>

          <View
            className="flex-row items-center justify-between p-4 bg-card border-2 border-border"
            style={{ boxShadow: `3px 3px 0 0 ${colors.border}` }}
          >
            <View>
              <CustomText variant="body">Dark Mode</CustomText>
              <CustomText variant="muted" className="text-xs mt-0.5">
                {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
              </CustomText>
            </View>
            <Switch value={isDark} onValueChange={handleToggleTheme} />
          </View>
        </View>

        {/* Logout */}
        <View className="mt-10 mb-8 mr-1">
          <Button
            variant="destructive"
            size="lg"
            onPress={handleLogout}
            disabled={logout.isPending}
          >
            {logout.isPending ? 'Logging out...' : 'Log Out'}
          </Button>
        </View>
      </ScrollView>
    </Container>
  );
};

export default memo(ProfileScreen);
