// App.js - FCM 설정 추가
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigations/AppNavigator';
import { WalletProvider } from './src/contexts/WalletContext';
import { AuthProvider } from './src/contexts/AuthContext';
import messaging from '@react-native-firebase/messaging';
import FCMUtils from './src/utils/FCMUtils';

// 백그라운드 메시지 핸들러 등록
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('백그라운드 메시지 수신:', remoteMessage);
  // 필요한 경우 데이터 저장 또는 알림 표시 처리
});

const App = () => {
  // FCM 설정 및 포그라운드 메시지 처리
  useEffect(() => {
    // FCM 초기화
    const initApp = async () => {
      await FCMUtils.initializeFCM();
      
      // 포그라운드 메시지 리스너 설정
      const unsubscribe = messaging().onMessage(async (remoteMessage) => {
        console.log('포그라운드 메시지 수신:', remoteMessage);
        // 필요한 경우 여기서 인앱 알림 표시 처리
      });
      
      return unsubscribe;
    };
    
    const unsubscribe = initApp();
    
    // 컴포넌트 언마운트 시 리스너 해제
    return () => {
      unsubscribe.then(fn => fn && fn());
    };
  }, []);

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