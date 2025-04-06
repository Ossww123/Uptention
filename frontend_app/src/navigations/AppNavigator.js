// src/navigations/AppNavigator.js
import React, { useEffect, useState } from "react";
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from '../contexts/AuthContext';
import ScreenTime from "../utils/ScreenTime";

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
  const [checkingPermissions, setCheckingPermissions] = useState(true); // 권한 체크 중 상태 추가
  
  // 인증 상태 변경 처리
  const handleLoginSuccess = () => {
    refreshAuth();
    checkScreenTimePermission(); // 로그인 성공 시 권한 확인
  };

  // 권한 상태 확인 함수
  const checkScreenTimePermission = async () => {
    try {
      setCheckingPermissions(true);
      const granted = await ScreenTime.hasUsageStatsPermission();
      console.log('스크린타임 권한 상태:', granted);
      setHasScreenTimePermission(granted);
    } catch (error) {
      console.error('권한 확인 오류:', error);
      setHasScreenTimePermission(false);
    } finally {
      setCheckingPermissions(false);
    }
  };

  // 권한 상태 변경 처리
  const handlePermissionGranted = () => {
    setHasScreenTimePermission(true);
  };

  // 지갑 연결 상태 변경 처리
  const handleWalletConnected = () => {
    updateWalletStatus(); // 지갑 연결 후 사용자 정보 갱신
  };

  // 인증 상태가 변경되면 권한 상태 확인
  useEffect(() => {
    if (isAuthenticated) {
      checkScreenTimePermission();
    }
  }, [isAuthenticated]);

  // 로딩 중이거나 권한 체크 중일 때 로딩 화면 표시
  if (isLoading || (isAuthenticated && checkingPermissions)) {
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