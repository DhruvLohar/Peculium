import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { getThemeColors } from '@/utils/themeColors';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);
  const bgColor = isDark ? '#1a1a1a' : '#ffffff';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.muted,
        headerTitleAlign: 'center',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: bgColor,
          borderTopColor: colors.border,
          borderTopWidth: 2,
        },
        tabBarLabelStyle: {
          fontFamily: 'SpaceGrotesk_700Bold',
          fontSize: 10,
          letterSpacing: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'TRANSACTIONS',
          tabBarIcon: ({ color }) => <FontAwesome name="rupee" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'INSIGHTS',
          tabBarIcon: ({ color }) => <FontAwesome name="line-chart" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
