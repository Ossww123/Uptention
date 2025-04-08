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
  
  // 초기 라우팅 로직
  const getInitialRoute = () => {
    console.log('초기 라우팅 결정:', { 
      isFirstRender: global.isFirstRender,
      isAuthenticated, 
      hasScreenTimePermission,
      forceScreen 
    });
    
    // 강제 화면이 있으면 우선 적용
    if (forceScreen) {
      return forceScreen;
    }
    
    if (global.isFirstRender) {
      global.isFirstRender = false;
      return "Splash";
    }
    
    if (!isAuthenticated) {
      return "Login";
    }
    
    // 권한이 있고 지갑도 있으면 바로 MainApp으로
    if (hasScreenTimePermission && publicKey) {
      return "MainApp";
    }
    
    // 권한은 있지만 지갑이 없으면 WalletConnect로
    if (hasScreenTimePermission && !publicKey) {
      return "WalletConnect";
    }
    
    // 권한이 없으면 Permissions로
    if (!hasScreenTimePermission) {
      return "Permissions";
    }
    
    return "MainApp";
  };

  useImperativeHandle(ref, () => ({
    navigate: (screen, params) => {
      navigationRef.current?.navigate(screen, params);
    }
  }));

  // 인증 상태 변경 처리
  const handleLoginSuccess = async () => {
    console.log('로그인 성공 핸들러 호출됨');
    
    try {
      await refreshAuth();
      console.log('인증 상태 갱신됨, 권한 체크 시작');
      
      // 권한 체크
      const screenTimeEnabled = await ScreenTime.hasUsageStatsPermission();
      const overlayEnabled = await ScreenTime.hasOverlayPermission();
      const accessibilityEnabled = await ScreenTime.hasAccessibilityPermission();
      
      const allPermissionsGranted = screenTimeEnabled && overlayEnabled && accessibilityEnabled;
      setHasScreenTimePermission(allPermissionsGranted);

      // 권한 상태에 따라 한 번에 적절한 화면으로 이동
      if (!allPermissionsGranted) {
        // 권한이 없는 경우에만 Permissions 화면으로
        setForceScreen('Permissions');
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: 'Permissions' }],
        });
      } else if (!publicKey) {
        // 권한은 있지만 지갑이 없는 경우 WalletConnect로
        setForceScreen('WalletConnect');
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: 'WalletConnect' }],
        });
      } else {
        // 모든 조건이 충족되면 MainApp으로
        setForceScreen('MainApp');
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        });
      }
    } catch (error) {
      console.error('로그인 성공 처리 오류:', error);
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