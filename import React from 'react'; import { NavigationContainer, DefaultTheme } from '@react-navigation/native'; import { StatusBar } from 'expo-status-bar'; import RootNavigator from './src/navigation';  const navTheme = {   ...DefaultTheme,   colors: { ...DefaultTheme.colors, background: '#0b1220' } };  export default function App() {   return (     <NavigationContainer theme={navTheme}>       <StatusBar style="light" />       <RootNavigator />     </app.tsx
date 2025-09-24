import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation';

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#0b1220' }
};

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <RootNavigator />
    </NavigationContainer>
  );
}
