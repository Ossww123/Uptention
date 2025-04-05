// App.js
import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Platform, StatusBar, AppState } from 'react-native';
import AppNavigator from './src/navigations/AppNavigator';
import { WalletProvider } from './src/contexts/WalletContext';
import { AuthProvider } from './src/contexts/AuthContext';
import messaging from '@react-native-firebase/messaging';
import FCMUtils from './src/utils/FCMUtils';
import InAppNotification from './src/components/InAppNotification';
import { NavigationContainer } from '@react-navigation/native';

// 백그라운드 메시지 핸들러 등록
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('백그라운드 메시지 수신:', remoteMessage);
  // 필요한 경우 데이터 저장 또는 알림 표시 처리
});

const App = () => {
  // 인앱 알림 상태 관리
  const [notification, setNotification] = useState(null);
  const navigationRef = useRef(null);
  const appState = useRef(AppState.currentState);

  // FCM 설정 및 포그라운드 메시지 처리
  useEffect(() => {
    // FCM 초기화
    const initApp = async () => {
      await FCMUtils.initializeFCM();
      
      // 포그라운드 메시지 리스너 설정
      const unsubscribe = messaging().onMessage(async (remoteMessage) => {
        console.log('포그라운드 메시지 수신:', remoteMessage);
        
        // 알림 데이터 추출
        const notificationData = {
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body || '새 알림이 왔습니다.',
          data: remoteMessage.data,
        };
        
        // 인앱 알림 표시
        setNotification(notificationData);
      });
      
      return unsubscribe;
    };
    
    const unsubscribePromise = initApp();
    
    // 앱 상태 모니터링
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
    });
    
    // 컴포넌트 언마운트 시 리스너 해제
    return () => {
      unsubscribePromise.then(fn => fn && fn());
      subscription.remove();
    };
  }, []);
  
  // 알림 클릭 핸들러
  const handleNotificationPress = () => {
    // 알림 클릭 시 NotificationScreen으로 이동
    if (navigationRef.current) {
      navigationRef.current.navigate('Notification');
    }
    setNotification(null);
  };

  return (
    <AuthProvider>
      <WalletProvider>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          
          <View style={{ flex: 1 }}>
            <NavigationContainer ref={navigationRef}>
              <AppNavigator />
            </NavigationContainer>
            
            {/* 인앱 알림 컴포넌트 */}
            {notification && (
              <InAppNotification 
                notification={notification}
                onPress={handleNotificationPress}
                onDismiss={() => setNotification(null)}
              />
            )}
          </View>
        </SafeAreaProvider>
      </WalletProvider>
    </AuthProvider>
  );
};

export default App;