import '../../global.css';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Platform } from 'react-native';
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
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useAuthState } from '@/hooks/useUserAuth';
import { useDeviceId } from '@/hooks/useDeviceId';
import { useRequestSmsPermissionOnce } from '@/hooks/useRequestSmsPermissionOnce';
import { useBankSmsDebugLogs } from '@/hooks/useBankSmsDebugLogs';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSmsTransactionSync } from '@/hooks/useSmsTransactionSync';
import BottomSheetProvider from '@/components/providers/BottomSheetProvider';
import ThemeProvider from '@/components/providers/ThemeProvider';

const queryClient = new QueryClient();

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const authState = useAuthState();
  const navigationState = useRootNavigationState();

  useSmsTransactionSync(authState === 'authenticated');

  useEffect(() => {
    if (authState === 'loading' || !navigationState?.key) return;

    const rootSegment = segments[0];

    try {
      if (authState === 'unauthenticated' && rootSegment !== '(auth)') {
        router.replace('/(auth)');
      } else if (authState === 'needs-onboarding' && rootSegment !== 'onboarding') {
        router.replace('/onboarding');
      } else if (
        authState === 'authenticated' &&
        (rootSegment === '(auth)' || rootSegment == null)
      ) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Failed to route after auth resolution:', error);
    } finally {
      void SplashScreen.hideAsync();
    }
  }, [authState, segments, router, navigationState?.key]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="transaction/add" options={{ headerShown: false }} />
      <Stack.Screen name="transaction/edit" options={{ headerShown: false }} />
      <Stack.Screen name="transaction/view" options={{ headerShown: false }} />
      <Stack.Screen name="transaction/pending" options={{ headerShown: false }} />
      <Stack.Screen name="profile/index" options={{ headerShown: false }} />
    </Stack>
  );
}

export const unstable_settings = {
  initialRouteName: '(auth)',
};

export default function RootLayout() {
  useDeviceId();
  useRequestSmsPermissionOnce();
  useBankSmsDebugLogs();

  const { trackAppOpened } = useAnalytics();
  const [loaded, error] = useFonts({
    ArchivoBlack_400Regular,
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      trackAppOpened({ platform: Platform.OS, app_version: '1.0.0' });
    }
  }, [error, loaded, trackAppOpened]);

  // Prevent rendering until fonts are loaded
  if (!loaded && !error) {
    return null;
  }

  // Once fonts are loaded, RootLayoutNav mounts, evaluates auth, and then drops the splash screen
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider>
            <BottomSheetProvider>
              <RootLayoutNav />
            </BottomSheetProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
