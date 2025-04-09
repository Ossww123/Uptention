import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, StatusBar, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import ScreenTime from '../../utils/ScreenTime'; // 권한 체크를 위한 유틸리티 임포트
import { useAuth } from '../../contexts/AuthContext'; // 인증 컨텍스트 임포트
import { useWallet } from '../../contexts/WalletContext'; // 지갑 컨텍스트 임포트
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = ({ navigation }) => {
  const [timePassed, setTimePassed] = useState(false);
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  const [allPermissionsGranted, setAllPermissionsGranted] = useState(false);
  const { isAuthenticated , isLoading} = useAuth();
  const { publicKey } = useWallet();
  
  console.log('SplashScreen 렌더링됨');

  // 필요한 권한들을 확인하는 함수
  const checkPermissions = async () => {
    
    try {
      
      // 세 가지 권한을 동시에 확인
      const [screenTimeGranted, overlayGranted, accessibilityGranted] = await Promise.all([
        ScreenTime.hasUsageStatsPermission(),
        ScreenTime.hasOverlayPermission(),
        ScreenTime.hasAccessibilityPermission()
      ]);
      
      // 모든 권한이 허용되었는지 확인
      const granted = screenTimeGranted && overlayGranted && accessibilityGranted;
      setAllPermissionsGranted(granted);
      setPermissionsChecked(true);
      
      console.log('권한 상태 확인 완료:', { 
        screenTime: screenTimeGranted, 
        overlay: overlayGranted, 
        accessibility: accessibilityGranted 
      });
    } catch (error) {
      console.error('권한 확인 중 오류 발생:', error);
      setPermissionsChecked(true); // 오류가 발생해도 체크는 완료된 것으로 표시
    }
  };

  // 컴포넌트 마운트 시 권한 확인 시작
  useEffect(() => {
    console.log('SplashScreen useEffect 실행됨');
    checkPermissions();
    const setWelcomeOverlayFlag = async () => {
      try {
        await AsyncStorage.setItem('show_welcome_overlay', 'true');
        console.log('Welcome overlay flag set to true');
      } catch (error) {
        console.error('AsyncStorage 설정 오류:', error);
      }
    };
    setWelcomeOverlayFlag(); // 이 줄 추가
    
    // 첫 번째 타이머 - 상태 변경
    const timer = setTimeout(() => {
      console.log('타이머 실행: 상태 변경');
      setTimePassed(true);
    }, 2000);
    
    return () => {
      console.log('SplashScreen useEffect 정리됨');
      clearTimeout(timer);
    };
  }, []);
  
  // 타이머와 권한 체크가 모두 완료되면 적절한 화면으로 이동
  useEffect(() => {
    if (timePassed && permissionsChecked && !isLoading) {
      console.log('상태 변경 감지: 다음 화면으로 이동 시도');
      console.log('권한 상태:', allPermissionsGranted ? '모두 허용됨' : '일부 권한 필요');
      
      // 네비게이션 타이머
      const navigationTimer = setTimeout(() => {
        try {
          if (!isAuthenticated) {
            // 로그인되지 않았으면 로그인 화면으로
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })
            );
          } else if (!allPermissionsGranted) {
            // 로그인은 되었지만 권한이 없으면 권한 화면으로
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Permissions' }],
              })
            );
          } else if (!publicKey) {
            // 로그인과 권한은 있지만 지갑 연결이 안 되어 있으면
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'WalletConnect' }],
              })
            );
          } else {
            // 모든 조건이 충족되면 메인 앱으로
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'MainApp' }],
              })
            );
          }
          console.log('네비게이션 명령 실행됨');
        } catch (error) {
          console.error('네비게이션 오류:', error);
          
          // 오류 발생 시 기본적으로 로그인 화면으로
          setTimeout(() => {
            console.log('네비게이션 재시도');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }, 1000);
        }
      }, 500);
      
      return () => clearTimeout(navigationTimer);
    }
  }, [timePassed, permissionsChecked, allPermissionsGranted, isAuthenticated, publicKey, navigation,isLoading]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/splashscreen_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 300,
    height: 300,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  }
});

export default SplashScreen;