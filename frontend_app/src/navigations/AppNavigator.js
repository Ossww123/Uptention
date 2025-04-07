// src/navigations/AppNavigator.js
import React, { useEffect, useState } from "react";
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import ScreenTime from "../utils/ScreenTime";

// 스크린 컴포넌트 임포트
import SplashScreen from "../screens/auth/SplashScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import PermissionsScreen from "../screens/auth/PermissionsScreen";
import WalletConnectScreen from "../screens/auth/WalletConnectScreen";
import StackNavigator from "./StackNavigator";

// 네비게이션 스택 생성
const Stack = createNativeStackNavigator();

const AppNavigator = forwardRef((props, ref) => {
  const { isAuthenticated, isLoading, refreshAuth } = useAuth();
  const { publicKey } = useWallet();
  const navigationRef = useRef(null);
  const [hasScreenTimePermission, setHasScreenTimePermission] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  useImperativeHandle(ref, () => ({
    navigate: (screen, params) => {
      navigationRef.current?.navigate(screen, params);
    }
  }));

  // 권한 체크 함수 수정
  const checkPermissions = async () => {
    try {
      setIsCheckingPermissions(true);
      
      // 메소드 이름을 ScreenTime.js에 맞게 수정
      const screenTimeEnabled = await ScreenTime.hasUsageStatsPermission();
      const overlayEnabled = await ScreenTime.hasOverlayPermission();
      const accessibilityEnabled = await ScreenTime.hasAccessibilityPermission();

      console.log('권한 체크 결과:', {
        screenTime: screenTimeEnabled,
        overlay: overlayEnabled,
        accessibility: accessibilityEnabled
      });

      const allPermissionsGranted = screenTimeEnabled && overlayEnabled && accessibilityEnabled;
      setHasScreenTimePermission(allPermissionsGranted);
    } catch (error) {
      console.error('권한 체크 중 오류:', error);
      setHasScreenTimePermission(false);
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  // 인증 상태 변경 처리
  const handleLoginSuccess = async () => {
    await refreshAuth();
    checkPermissions(); // 로그인 성공 후 권한 체크
  };

  // 권한 상태 변경 처리
  const handlePermissionGranted = async (permissions) => {
    console.log('권한 상태 변경:', permissions);
    if (permissions.screenTime && permissions.overlay && permissions.accessibility) {
      console.log('모든 권한이 허용됨');
      await checkPermissions(); // 권한 변경 후 실제 권한 상태 확인
    }
  };

  // 컴포넌트 마운트 시와 인증 상태 변경 시 권한 체크
  useEffect(() => {
    if (isAuthenticated) {
      checkPermissions();
    }
  }, [isAuthenticated]);

  // 로딩 중이거나 권한 체크 중일 때 로딩 화면 표시
  if (isLoading || isCheckingPermissions) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                onLoginSuccess={handleLoginSuccess}
              />
            )}
          </Stack.Screen>
        ) : !hasScreenTimePermission ? (
          <Stack.Screen name="Permissions">
            {(props) => (
              <PermissionsScreen
                {...props}
                permissions={{
                  screenTime: false,
                  overlay: false,
                  accessibility: false
                }}
                onPermissionsGranted={handlePermissionGranted}
              />
            )}
          </Stack.Screen>
        ) : !publicKey ? (
          <Stack.Screen name="WalletConnect" component={WalletConnectScreen} />
        ) : (
          <Stack.Screen name="MainApp" component={StackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
});

export default AppNavigator;