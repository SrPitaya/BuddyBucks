import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import SplashScreenBB from '@/components/SplashScreenBB';



export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded || !isAppReady) {
    return(
    <SplashScreenBB
    onFinish={(isCancelled) => !isCancelled && setIsAppReady(true)}
    />
  );
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        {/* Remove Stack.Screen for (tabs) and +not-found */}
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

