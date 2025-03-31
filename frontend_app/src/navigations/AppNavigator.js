import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 기존 네비게이터 임포트
import StackNavigator from "./StackNavigator";

// 인증 및 온보딩 화면 임포트
import SplashScreen from "../screens/auth/SplashScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import ScreenTimePermissionScreen from "../screens/auth/ScreenTimePermissionScreen";
import WalletConnectScreen from "../screens/auth/WalletConnectScreen";

// 네비게이션 스택 생성
const Stack = createNativeStackNavigator();

// 앱 상태 관련 키
const AUTH_STATUS_KEY = "auth_status";
const SCREEN_TIME_PERMISSION_KEY = "screen_time_permission";
const WALLET_CONNECTED_KEY = "wallet_connected";

const AppNavigator = () => {
  // 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasScreenTimePermission, setHasScreenTimePermission] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  // 앱 실행 시 상태 체크
  useEffect(() => {
    const checkAppState = async () => {
      try {
        // 1초 지연 (스플래시 화면 표시 목적)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 테스트를 위한 상태 초기화 코드 추가
        // 테스트를 위한 상태 초기화 코드 추가
        // 테스트를 위한 상태 초기화 코드 추가
        // 테스트를 위한 상태 초기화 코드 추가
        // 테스트를 위한 상태 초기화 코드 추가
        await AsyncStorage.setItem(AUTH_STATUS_KEY, "false");
        await AsyncStorage.setItem(SCREEN_TIME_PERMISSION_KEY, "false");
        await AsyncStorage.setItem(WALLET_CONNECTED_KEY, "false");

        // AsyncStorage에서 로그인, 권한, 지갑 연결 상태 확인
        const authStatus = await AsyncStorage.getItem(AUTH_STATUS_KEY);
        const screenTimeStatus = await AsyncStorage.getItem(
          SCREEN_TIME_PERMISSION_KEY
        );
        const walletStatus = await AsyncStorage.getItem(WALLET_CONNECTED_KEY);

        setIsLoggedIn(authStatus === "true");
        setHasScreenTimePermission(screenTimeStatus === "true");
        setIsWalletConnected(walletStatus === "true");
      } catch (error) {
        console.error("App state check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAppState();
  }, []);

  // 로그인 상태 업데이트 함수
  const updateAuthStatus = async (status) => {
    try {
      await AsyncStorage.setItem(AUTH_STATUS_KEY, status ? "true" : "false");
      setIsLoggedIn(status);
    } catch (error) {
      console.error("Failed to update auth status:", error);
    }
  };

  // 스크린타임 권한 상태 업데이트 함수
  const updateScreenTimePermission = async (status) => {
    try {
      await AsyncStorage.setItem(
        SCREEN_TIME_PERMISSION_KEY,
        status ? "true" : "false"
      );
      setHasScreenTimePermission(status);
    } catch (error) {
      console.error("Failed to update screen time permission status:", error);
    }
  };

  // 지갑 연결 상태 업데이트 함수
  const updateWalletConnection = async (status) => {
    try {
      await AsyncStorage.setItem(
        WALLET_CONNECTED_KEY,
        status ? "true" : "false"
      );
      setIsWalletConnected(status);
    } catch (error) {
      console.error("Failed to update wallet connection status:", error);
    }
  };

  // 로딩 중이면 스플래시 화면 표시
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          // 로그인되지 않은 상태
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                onLoginSuccess={() => updateAuthStatus(true)}
              />
            )}
          </Stack.Screen>
        ) : !hasScreenTimePermission ? (
          // 로그인은 되었지만 스크린타임 권한이 없는 상태
          <Stack.Screen name="ScreenTimePermission">
            {(props) => (
              <ScreenTimePermissionScreen
                {...props}
                onPermissionGranted={() => updateScreenTimePermission(true)}
              />
            )}
          </Stack.Screen>
        ) : !isWalletConnected ? (
          // 스크린타임 권한은 있지만 지갑이 연결되지 않은 상태
          <Stack.Screen name="WalletConnect">
            {(props) => (
              <WalletConnectScreen
                {...props}
                onWalletConnected={() => updateWalletConnection(true)}
              />
            )}
          </Stack.Screen>
        ) : (
          // 모든 조건이 충족된 상태 (메인 앱 화면으로 이동)
          <Stack.Screen name="MainApp" component={StackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
