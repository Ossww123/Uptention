// src/navigations/AppNavigator.js
import React, { useEffect, useState } from "react";
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from '../contexts/AuthContext';

// 스크린 컴포넌트 임포트
import SplashScreen from "../screens/auth/SplashScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import ScreenTimePermissionScreen from "../screens/auth/ScreenTimePermissionScreen";
import WalletConnectScreen from "../screens/auth/WalletConnectScreen";
import StackNavigator from "./StackNavigator";

// 개발용 AsyncStorage 초기화
// 개발용 AsyncStorage 초기화
// 개발용 AsyncStorage 초기화

// import AsyncStorage from '@react-native-async-storage/async-storage';
// const clearStorage = async () => {
//   try {
//     await AsyncStorage.clear();
//     console.log('Storage successfully cleared!');
//   } catch (e) {
//     console.log('Failed to clear the async storage.');
//   }
// }
// clearStorage();

// 개발용 AsyncStorage 초기화
// 개발용 AsyncStorage 초기화
// 개발용 AsyncStorage 초기화


// 네비게이션 스택 생성
const Stack = createNativeStackNavigator();

const AppNavigator = forwardRef((props, ref) => {
  const { 
    isAuthenticated, 
    isLoading, 
    refreshAuth, 
    isWalletConnected, 
    updateWalletStatus 
  } = useAuth();
  const navigationRef = useRef(null);

  useImperativeHandle(ref, () => ({
    navigate: (screen, params) => {
      navigationRef.current?.navigate(screen, params);
    }
  }));

  // 권한 관련 상태
  const [hasScreenTimePermission, setHasScreenTimePermission] = useState(false);

  // 인증 상태 변경 처리
  const handleLoginSuccess = () => {
    refreshAuth();
  };

  // 권한 상태 변경 처리
  const handlePermissionGranted = () => {
    setHasScreenTimePermission(true);
  };

  // 지갑 연결 상태 변경 처리
  const handleWalletConnected = () => {
    updateWalletStatus(); // 지갑 연결 후 사용자 정보 갱신
  };

  // 로딩 중일 때 로딩 화면 표시
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // 로그인 화면
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                onLoginSuccess={handleLoginSuccess}
              />
            )}
          </Stack.Screen>
        ) : !hasScreenTimePermission ? (
          // 스크린타임 권한 화면
          <Stack.Screen name="ScreenTimePermission">
            {(props) => (
              <ScreenTimePermissionScreen
                {...props}
                onPermissionGranted={handlePermissionGranted}
              />
            )}
          </Stack.Screen>
        ) : !isWalletConnected ? (
          // 지갑 연결 화면 - 이미 연결된 경우 건너뜀
          <Stack.Screen name="WalletConnect">
            {(props) => (
              <WalletConnectScreen
                {...props}
                onWalletConnected={handleWalletConnected}
              />
            )}
          </Stack.Screen>
        ) : (
          // 메인 앱 화면
          <Stack.Screen name="MainApp" component={StackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
});

export default AppNavigator;