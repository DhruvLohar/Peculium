import '../../global.css';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import {
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthState } from '@/hooks/useUserAuth';
import FixedBottomSheet from '@/components/atoms/FixedBottomSheet';
import TransactionFilters, {
  TRANSACTION_FILTERS_SHEET_ID,
  type TransactionFilterArgs,
} from '@/components/bottomsheets/TransactionFilters';

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const authState = useAuthState();

  useEffect(() => {
    if (authState === 'loading') return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (authState === 'unauthenticated' && !inAuth) {
      router.replace('/(auth)');
    } else if (authState === 'needs-onboarding' && !inOnboarding) {
      router.replace('/onboarding');
    } else if (authState === 'authenticated' && inAuth) {
      // Authenticated users shouldn't be in auth screens
      router.replace('/(tabs)');
    }
  }, [authState, segments, router]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="transaction/add" options={{ headerShown: false }} />
      <Stack.Screen name="transaction/edit" options={{ headerShown: false }} />
      <Stack.Screen name="transaction/view" options={{ headerShown: false }} />
    </Stack>
  );
}

export const unstable_settings = {
  initialRouteName: '(auth)',
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ArchivoBlack_400Regular,
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const hideSplashScreen = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      void hideSplashScreen();
    }
  }, [error, hideSplashScreen, loaded]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <View style={{ flex: 1 }}>
          <RootLayoutNav />

          {/* Global bottom sheets — render above everything including tab bar */}
          <FixedBottomSheet<TransactionFilterArgs> id={TRANSACTION_FILTERS_SHEET_ID}>
            {(args) => <TransactionFilters {...args} />}
          </FixedBottomSheet>
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
