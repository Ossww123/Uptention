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
    
    if (!hasScreenTimePermission) {
      return "Permissions";
    }
    
    if (!publicKey) {
      return "WalletConnect";
    }
    
    return "MainApp";
  };

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
      
      // 인증은 되었지만 권한이 없는 경우, Permissions 화면으로 강제 이동
      if (isAuthenticated && !allPermissionsGranted) {
        console.log('권한 없음, Permissions 화면으로 강제 이동 설정');
        setForceScreen('Permissions');
        
        // navigationRef가 있으면 직접 이동 시도
        if (navigationRef.current) {
          setTimeout(() => {
            try {
              navigationRef.current.reset({
                index: 0,
                routes: [{ name: 'Permissions' }],
              });
            } catch (e) {
              console.error('네비게이션 리셋 오류:', e);
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error('권한 체크 중 오류:', error);
      setHasScreenTimePermission(false);
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  // 인증 상태 변경 처리
  const handleLoginSuccess = async () => {
    console.log('로그인 성공 핸들러 호출됨');
    
    try {
      await refreshAuth();
      console.log('인증 상태 갱신됨, 권한 체크 시작');
      
      // 로그인 성공 직후 권한 화면으로 강제 이동
      setForceScreen('Permissions');
      
      // 약간의 지연 후 권한 체크 실행 (상태 업데이트 보장)
      setTimeout(async () => {
        await checkPermissions();
        
        // navigationRef가 있으면 직접 이동 시도
        if (navigationRef.current) {
          try {
            console.log('로그인 성공 후 Permissions 화면으로 직접 이동 시도');
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: 'Permissions' }],
            });
          } catch (e) {
            console.error('네비게이션 리셋 오류:', e);
          }
        }
      }, 500);
    } catch (error) {
      console.error('로그인 성공 처리 오류:', error);
    }
  };

  // 권한 상태 변경 처리
  const handlePermissionGranted = async (permissions) => {
    console.log('권한 상태 변경:', permissions);
    if (permissions.screenTime && permissions.overlay && permissions.accessibility) {
      console.log('모든 권한이 허용됨');
      await checkPermissions(); // 권한 변경 후 실제 권한 상태 확인
      
      // 모든 권한이 허용되고 지갑이 없다면 WalletConnect 화면으로 강제 이동
      if (!publicKey) {
        setForceScreen('WalletConnect');
        
        // navigationRef가 있으면 직접 이동 시도
        if (navigationRef.current) {
          setTimeout(() => {
            try {
              navigationRef.current.reset({
                index: 0,
                routes: [{ name: 'WalletConnect' }],
              });
            } catch (e) {
              console.error('네비게이션 리셋 오류:', e);
            }
          }, 500);
        }
      }
    }
  };

  // 컴포넌트 마운트 시와 인증 상태 변경 시 권한 체크
  useEffect(() => {
    if (isAuthenticated) {
      console.log('인증 상태 변경 감지, 권한 체크 실행');
      checkPermissions();
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
        initialRouteName={getInitialRoute()}
        screenOptions={{ headerShown: false }}
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
                setForceScreen(null);
                props.navigation.replace('MainApp');
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