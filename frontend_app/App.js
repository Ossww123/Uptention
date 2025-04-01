import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import StackNavigator from './src/navigations/StackNavigator';
import { WalletProvider } from './src/contexts/WalletContext';

const App = () => {
  return (
    <WalletProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <StackNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </WalletProvider>
  );
};

export default App;