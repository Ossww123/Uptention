// App.js
import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigations/AppNavigator';
import { WalletProvider } from './src/contexts/WalletContext';
import { AuthProvider } from './src/contexts/AuthContext';
import messaging from '@react-native-firebase/messaging';
import FCMUtils from './src/utils/FCMUtils';
import InAppNotification from './src/components/InAppNotification';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

// 백그라운드 메시지 핸들러 등록
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  // 필요한 경우 AsyncStorage에 알림 데이터 저장
  if (remoteMessage.data) {
    await AsyncStorage.setItem('lastNotification', JSON.stringify(remoteMessage.data));
  }
});

const App = () => {
  const [notification, setNotification] = useState(null);
  // 네비게이션 참조 생성
  const appNavigatorRef = useRef(null);

  // 앱 초기화 시 isFirstRender 설정
  useEffect(() => {
    global.isFirstRender = true;
  }, []);

  // requestNotificationPermission를 컴포넌트 내부로 이동
  const requestNotificationPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  };

  // FCM 권한 요청 useEffect
  useEffect(() => {
    requestNotificationPermission();
  }, []);
  
  // FCM 설정 및 포그라운드 메시지 처리
  useEffect(() => {
    // FCM 초기화
    const initApp = async () => {
      await FCMUtils.initializeFCM();
      
      // 포그라운드 메시지 리스너 설정
      const unsubscribe = messaging().onMessage(async (remoteMessage) => {
        
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
    
    // 컴포넌트 언마운트 시 리스너 해제
    return () => {
      unsubscribePromise.then(fn => fn && fn());
    };
  }, []);

  // 알림 클릭 처리 useEffect
  useEffect(() => {
    // 앱이 종료된 상태에서 알림을 클릭하여 열리는 경우
    messaging()
      .getInitialNotification()
      .then(async (remoteMessage) => {
        if (remoteMessage) {
          
          // AsyncStorage에서 알림 데이터 확인
          const storedNotification = await AsyncStorage.getItem('lastNotification');
          
          setTimeout(() => {
            if (appNavigatorRef.current) {
              appNavigatorRef.current.navigate('Notification', {
                notificationData: storedNotification ? JSON.parse(storedNotification) : null
              });
            }
          }, 1500);
        }
      });

    // 백그라운드 상태에서 알림을 클릭하는 경우
    const unsubscribe = messaging().onNotificationOpenedApp(async (remoteMessage) => {
      
      // AsyncStorage에서 알림 데이터 확인
      const storedNotification = await AsyncStorage.getItem('lastNotification');
      
      if (appNavigatorRef.current) {
        appNavigatorRef.current.navigate('Notification', {
          notificationData: storedNotification ? JSON.parse(storedNotification) : null
        });
      }
    });

    return unsubscribe;
  }, []);
  
  // 알림 클릭 시 화면 이동 처리
  const handleNotificationPress = () => {
    if (appNavigatorRef.current) {
      appNavigatorRef.current.navigate('Notification');
    }
    setNotification(null);
  };
  
  // 알림 컴포넌트가 사라질 때 처리
  const handleDismissNotification = () => {
    setNotification(null);
  };

  return (
    <AuthProvider>
      <WalletProvider>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          
          <AppNavigator ref={appNavigatorRef} />
          
          {/* 인앱 알림 컴포넌트 */}
          {notification && (
            <InAppNotification 
              notification={notification}
              onPress={handleNotificationPress}
              onDismiss={handleDismissNotification}
            />
          )}
        </SafeAreaProvider>
      </WalletProvider>
    </AuthProvider>
  );
};

export default App;