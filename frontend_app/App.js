// App.js 수정 버전 (NavigationContainer 중복 사용 시)
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StatusBar } from 'react-native';
import AppNavigator from './src/navigations/AppNavigator';
import { WalletProvider } from './src/contexts/WalletContext';
import { AuthProvider } from './src/contexts/AuthContext';
import messaging from '@react-native-firebase/messaging';
import FCMUtils from './src/utils/FCMUtils';
import InAppNotification from './src/components/InAppNotification';

// 백그라운드 메시지 핸들러 등록
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('백그라운드 메시지 수신:', remoteMessage);
});

const App = () => {
  const [notification, setNotification] = useState(null);
  
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
  
  // 이 함수를 AppNavigator에 전달하여 알림 클릭 시 화면 이동 처리
  const handleNotificationPress = (navigation) => {
    if (navigation) {
      navigation.navigate('Notification');
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
          
          <View style={{ flex: 1 }}>
            <AppNavigator 
              notificationHandler={handleNotificationPress}
            />
            
            {/* 인앱 알림 컴포넌트 */}
            {notification && (
              <InAppNotification 
                notification={notification}
                onPress={() => {
                  // 글로벌 상태나 이벤트 에미터를 통해 네비게이션 처리
                  global.notificationPressed = true;
                  setNotification(null);
                }}
                onDismiss={handleDismissNotification}
              />
            )}
          </View>
        </SafeAreaProvider>
      </WalletProvider>
    </AuthProvider>
  );
};

export default App;