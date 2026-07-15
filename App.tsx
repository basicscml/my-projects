import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { RoutinesProvider } from './src/store/RoutinesContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  const scheme = useColorScheme();
  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <SafeAreaProvider>
      <RoutinesProvider>
        <NavigationContainer theme={navTheme}>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      </RoutinesProvider>
    </SafeAreaProvider>
  );
}
