// App.js 최종 수정 버전
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigations/AppNavigator';
import { WalletProvider } from './src/contexts/WalletContext';
import { AuthProvider } from './src/contexts/AuthContext';
import messaging from '@react-native-firebase/messaging';
import FCMUtils from './src/utils/FCMUtils';
import InAppNotification from './src/components/InAppNotification';

// 백그라운드 메시지 핸들러 등록
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('백그라운드 메시지 수신:', remoteMessage);
  // 백그라운드에서는 시스템이 자동으로 알림을 표시해주므로,
  // 추가적인 처리가 필요 없음
});

const App = () => {
  const [notification, setNotification] = useState(null);
  // 네비게이션 참조 생성
  const navigationRef = React.useRef(null);
  
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
    
    // 컴포넌트 언마운트 시 리스너 해제
    return () => {
      unsubscribePromise.then(fn => fn && fn());
    };
  }, []);

  // 알림 클릭 처리
  useEffect(() => {
    // 앱이 종료된 상태에서 알림을 클릭하여 열리는 경우
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('종료된 상태에서 알림을 통해 앱 열림:', remoteMessage);
          
          // 인증 상태 확인 후 네비게이션 처리 (약간 지연 필요)
          setTimeout(() => {
            if (navigationRef.current) {
              navigationRef.current.navigate('Notification');
            }
          }, 1500); // 인증 처리 시간 고려하여 지연
        }
      });

    // 백그라운드 상태에서 알림을 클릭하는 경우
    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('백그라운드에서 알림 클릭으로 앱 열림:', remoteMessage);
      
      // NotificationScreen으로 이동
      if (navigationRef.current) {
        navigationRef.current.navigate('Notification');
      }
    });

    return unsubscribe;
  }, []);
  
  // 알림 클릭 시 화면 이동 처리
  const handleNotificationPress = () => {
    if (navigationRef.current) {
      navigationRef.current.navigate('Notification');
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
          
            <AppNavigator />
            
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