import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import SplashScreenBB from '@/components/SplashScreenBB';

// Configuración del tema de React Native Paper
const customTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#52CC99', // Color principal para los componentes
    background: '#FFFFFF', // Fondo blanco
  },
};

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded || !isAppReady) {
    return (
      <SplashScreenBB
        onFinish={(isCancelled) => !isCancelled && setIsAppReady(true)}
      />
    );
  }

  return (
    <PaperProvider theme={customTheme}>
      <ThemeProvider value={DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
          <Stack.Screen name="grupoGasto" options={{ title: "Grupo de Gastos" }} />
          <Stack.Screen name="perfil" options={{ title: "Perfil" }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </PaperProvider>
  );
}