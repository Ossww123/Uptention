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
import PermissionsScreen from "../screens/auth/PermissionsScreen"; // 권한 설정 화면 이름 변경
import WalletConnectScreen from "../screens/auth/WalletConnectScreen";
import StackNavigator from "./StackNavigator";

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
  const [permissions, setPermissions] = useState({
    screenTime: false,
    overlay: false,
    accessibility: false
  });
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [allPermissionsGranted, setAllPermissionsGranted] = useState(false);

  // 인증 상태 변경 처리
  const handleLoginSuccess = () => {
    refreshAuth();
    checkAllPermissions(); // 로그인 성공 시 권한 확인
  };

  // 모든 권한 상태 확인 함수
  const checkAllPermissions = async () => {
    try {
      setCheckingPermissions(true);
      
      // 세 가지 권한 모두 확인
      const [screenTimeGranted, overlayGranted, accessibilityGranted] = await Promise.all([
        ScreenTime.hasUsageStatsPermission(),
        ScreenTime.hasOverlayPermission(),
        ScreenTime.hasAccessibilityPermission()
      ]);
      
      console.log('권한 상태:', { 
        screenTime: screenTimeGranted,
        overlay: overlayGranted,
        accessibility: accessibilityGranted
      });
      
      // 상태 업데이트
      const updatedPermissions = {
        screenTime: screenTimeGranted,
        overlay: overlayGranted,
        accessibility: accessibilityGranted
      };
      
      setPermissions(updatedPermissions);
      
      // 모든 권한이 허용되었는지 확인
      const allGranted = screenTimeGranted && overlayGranted && accessibilityGranted;
      setAllPermissionsGranted(allGranted);
      
    } catch (error) {
      console.error('권한 확인 오류:', error);
      setAllPermissionsGranted(false);
    } finally {
      setCheckingPermissions(false);
    }
  };

  // 권한 상태 변경 처리
  const handlePermissionsGranted = (updatedPermissions) => {
    setPermissions(updatedPermissions);
    
    // 모든 권한이 허용되었는지 확인
    const allGranted = 
      updatedPermissions.screenTime && 
      updatedPermissions.overlay && 
      updatedPermissions.accessibility;
    
    setAllPermissionsGranted(allGranted);
  };

  // 지갑 연결 상태 변경 처리
  const handleWalletConnected = () => {
    updateWalletStatus();
  };

  // 인증 상태가 변경되면 권한 상태 확인
  useEffect(() => {
    if (isAuthenticated) {
      checkAllPermissions();
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
        ) : !allPermissionsGranted ? (
          // 권한 설정 화면
          <Stack.Screen name="Permissions">
            {(props) => (
              <PermissionsScreen
                {...props}
                permissions={permissions}
                onPermissionsGranted={handlePermissionsGranted}
              />
            )}
          </Stack.Screen>
        ) : !isWalletConnected ? (
          // 지갑 연결 화면
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