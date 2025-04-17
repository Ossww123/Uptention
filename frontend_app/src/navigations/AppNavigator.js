import React, { useEffect, useState } from "react";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
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
    // 전환 중이면 이전 라우트 유지
    if (isTransitioning) {
      return previousRoute;
    }

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

  // 라우트 변경 추적을 위한 useEffect 추가
  useEffect(() => {
    const currentRoute = getInitialRoute();
    if (currentRoute !== previousRoute && !isTransitioning) {
      setPreviousRoute(currentRoute);
    }
  }, [
    isAuthenticated,
    hasScreenTimePermission,
    publicKey,
    forceScreen,
    isTransitioning,
  ]);

  useImperativeHandle(ref, () => ({
    navigate: (screen, params) => {
      navigationRef.current?.navigate(screen, params);
    },
  }));

  // 로그인 성공 핸들러 수정
  const handleLoginSuccess = async () => {
    setIsTransitioning(true);

    try {
      await refreshAuth();

      // 모든 필요한 정보를 한 번에 확인
      const [screenTimeEnabled, overlayEnabled, accessibilityEnabled] =
        await Promise.all([
          ScreenTime.hasUsageStatsPermission(),
          ScreenTime.hasOverlayPermission(),
          ScreenTime.hasAccessibilityPermission(),
        ]);

      const allPermissionsGranted =
        screenTimeEnabled && overlayEnabled && accessibilityEnabled;

      // 최종 목적지 결정 (상태 업데이트 없이)
      let finalDestination;
      if (!allPermissionsGranted) {
        finalDestination = "Permissions";
      } else if (!publicKey) {
        finalDestination = "WalletConnect";
      } else {
        finalDestination = "MainApp";
      }

      // 한 번에 네비게이션 실행 (상태 업데이트 없이)
      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: finalDestination }],
      });

      // 네비게이션 완료 후 상태 업데이트
      setHasScreenTimePermission(allPermissionsGranted);
      setPreviousRoute(finalDestination);
      setIsTransitioning(false);
    } catch (error) {
      setIsTransitioning(false);
    }
  };

  // 권한 상태 변경 처리
  const handlePermissionGranted = async (permissions) => {
    if (
      permissions.screenTime &&
      permissions.overlay &&
      permissions.accessibility
    ) {
      setHasScreenTimePermission(true);

      // 권한이 허용되면 지갑 상태에 따라 한 번에 이동
      if (!publicKey) {
        setForceScreen("WalletConnect");
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: "WalletConnect" }],
        });
      } else {
        setForceScreen("MainApp");
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: "MainApp" }],
        });
      }
    }
  };

  // 컴포넌트 마운트 시와 인증 상태 변경 시 권한 체크
  useEffect(() => {
    if (isAuthenticated) {
      // 불필요한 checkPermissions 호출 제거
    }
  }, [isAuthenticated]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 200,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login">
          {(props) => (
            <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />
          )}
        </Stack.Screen>
        <Stack.Screen name="Permissions">
          {(props) => (
            <PermissionsScreen
              {...props}
              permissions={{
                screenTime: false,
                overlay: false,
                accessibility: false,
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
                  routes: [{ name: "MainApp" }],
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