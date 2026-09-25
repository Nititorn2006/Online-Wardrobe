import {
  DefaultTheme,
  Stack,
  ThemeProvider,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Palette } from '@/constants/design';
import { TextSizeProvider } from '@/features/wardrobe/settings/text-size-provider';
import {
  WardrobeProvider,
  useWardrobe,
} from '@/features/wardrobe/wardrobe-provider';

void SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DefaultTheme,

  colors: {
    ...DefaultTheme.colors,

    background: Palette.background,
    card: Palette.surface,
    primary: Palette.brand,
    text: Palette.ink,
    border: Palette.border,
  },
};

function Navigation() {
  const { isHydrated } = useWardrobe();

  useEffect(() => {
    if (isHydrated) {
      void SplashScreen.hideAsync();
    }
  }, [isHydrated]);

  if (!isHydrated) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="dark" />

      <Stack
        screenOptions={{
          headerShown: false,

          contentStyle: {
            backgroundColor:
              Palette.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" />

        <Stack.Screen
          name="add-clothes"
          options={{
            animation:
              'slide_from_bottom',
            presentation:
              'fullScreenModal',
          }}
        />

        <Stack.Screen
          name="clothes"
          options={{
            animation:
              'slide_from_bottom',
            presentation: 'modal',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <TextSizeProvider>
      <WardrobeProvider>
        <Navigation />
      </WardrobeProvider>
    </TextSizeProvider>
  );
}