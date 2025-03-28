import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import StackNavigator from './navigations/StackNavigator';


export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <StackNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
