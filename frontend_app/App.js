// App.js
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigations/AppNavigator';
import { WalletProvider } from './src/contexts/WalletContext';
import { AuthProvider } from './src/contexts/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <WalletProvider>
        <SafeAreaProvider>
          <AppNavigator />
        </SafeAreaProvider>
      </WalletProvider>
    </AuthProvider>
  );
};

export default App;