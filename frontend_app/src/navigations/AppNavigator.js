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

// 앱 재시작 플래그 생성 (릴리스 모드 문제 해결용)
global.isFirstRender = true;

const AppNavigator = forwardRef((props, ref) => {
  const { isAuthenticated, isLoading, refreshAuth } = useAuth();
  const { publicKey } = useWallet();
  const navigationRef = useRef(null);
  const [hasScreenTimePermission, setHasScreenTimePermission] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  const [forceScreen, setForceScreen] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousRoute, setPreviousRoute] = useState("Splash");
  
  // 초기 라우팅 로직
  const getInitialRoute = () => {
    console.log('초기 라우팅 결정:', { 
      isFirstRender: global.isFirstRender,
      isAuthenticated, 
      hasScreenTimePermission,
      forceScreen,
      isTransitioning,
      previousRoute
    });
    
    // 전환 중이면 이전 라우트 유지
    if (isTransitioning) {
      return previousRoute;
    }
    
    // 강제 화면이 있으면 우선 적용
    if (forceScreen) {
      setPreviousRoute(forceScreen);
      return forceScreen;
    }
    
    if (global.isFirstRender) {
      global.isFirstRender = false;
      setPreviousRoute("Splash");
      return "Splash";
    }
    
    let route;
    
    if (!isAuthenticated) {
      route = "Login";
    }
    // 권한이 있고 지갑도 있으면 바로 MainApp으로
    else if (hasScreenTimePermission && publicKey) {
      route = "MainApp";
    }
    // 권한은 있지만 지갑이 없으면 WalletConnect로
    else if (hasScreenTimePermission && !publicKey) {
      route = "WalletConnect";
    }
    // 권한이 없으면 Permissions로
    else if (!hasScreenTimePermission) {
      route = "Permissions";
    }
    else {
      route = "MainApp"; // 기본값
    }
    
    setPreviousRoute(route);
    return route;
  };

  useImperativeHandle(ref, () => ({
    navigate: (screen, params) => {
      navigationRef.current?.navigate(screen, params);
    }
  }));

  // 로그인 성공 핸들러 수정
const handleLoginSuccess = async () => {
  console.log('로그인 성공 핸들러 호출됨');
  setIsTransitioning(true); // 전환 중 플래그 추가
  
  try {
    await refreshAuth();
    console.log('인증 상태 갱신됨, 권한 체크 시작');
    
    // 모든 필요한 정보를 한 번에 확인
    const [screenTimeEnabled, overlayEnabled, accessibilityEnabled] = await Promise.all([
      ScreenTime.hasUsageStatsPermission(),
      ScreenTime.hasOverlayPermission(),
      ScreenTime.hasAccessibilityPermission()
    ]);
    
    const allPermissionsGranted = screenTimeEnabled && overlayEnabled && accessibilityEnabled;
    setHasScreenTimePermission(allPermissionsGranted);
    
    // 최종 목적지 결정
    let finalDestination;
    if (!allPermissionsGranted) {
      finalDestination = 'Permissions';
      setForceScreen('Permissions');
    } else if (!publicKey) {
      finalDestination = 'WalletConnect';
      setForceScreen('WalletConnect');
    } else {
      finalDestination = 'MainApp';
      setForceScreen('MainApp');
    }
    
    console.log('최종 목적지 결정:', finalDestination);
    
    // 한 번만 네비게이션 실행
    setTimeout(() => {
      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: finalDestination }],
      });
      setPreviousRoute(finalDestination);
      setIsTransitioning(false);
    }, 300); // 약간의 지연으로 화면 깜빡임 방지
  } catch (error) {
    console.error('로그인 성공 처리 오류:', error);
    setIsTransitioning(false);
  }
};

  // 권한 상태 변경 처리
  const handlePermissionGranted = async (permissions) => {
    console.log('권한 상태 변경:', permissions);
    if (permissions.screenTime && permissions.overlay && permissions.accessibility) {
      console.log('모든 권한이 허용됨');
      setHasScreenTimePermission(true);
      
      // 권한이 허용되면 지갑 상태에 따라 한 번에 이동
      if (!publicKey) {
        setForceScreen('WalletConnect');
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: 'WalletConnect' }],
        });
      } else {
        setForceScreen('MainApp');
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        });
      }
    }
  };

  // 컴포넌트 마운트 시와 인증 상태 변경 시 권한 체크
  useEffect(() => {
    if (isAuthenticated) {
      console.log('인증 상태 변경 감지');
      // 불필요한 checkPermissions 호출 제거
    }
  }, [isAuthenticated]);

  console.log('AppNavigator 상태:', { 
    isLoading, 
    isCheckingPermissions, 
    isAuthenticated, 
    hasScreenTimePermission,
    publicKey: publicKey ? '있음' : '없음',
    forceScreen,
    initialRoute: getInitialRoute()
  });

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{ 
          headerShown: false,
          animation: 'fade',
          animationDuration: 200
        }}
      >
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen} 
        />
        <Stack.Screen name="Login">
          {(props) => (
            <LoginScreen
              {...props}
              onLoginSuccess={handleLoginSuccess}
            />
          )}
        </Stack.Screen>
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
        <Stack.Screen name="WalletConnect">
          {(props) => (
            <WalletConnectScreen
              {...props}
              onWalletConnected={() => {
                navigationRef.current?.reset({
                  index: 0,
                  routes: [{ name: 'MainApp' }],
                });
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="MainApp" component={StackNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
});

export default AppNavigator;