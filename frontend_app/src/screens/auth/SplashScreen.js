// src/screens/auth/SplashScreen.js
import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, StatusBar, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';

const SplashScreen = ({ navigation }) => {
  const [timePassed, setTimePassed] = useState(false);
  
  console.log('SplashScreen 렌더링됨');

  useEffect(() => {
    console.log('SplashScreen useEffect 실행됨');
    
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
  
  // 상태가 변경되면 네비게이션 실행
  useEffect(() => {
    if (timePassed) {
      console.log('상태 변경 감지: 다음 화면으로 이동 시도');
      
      // 두 번째 타이머 - 실제 네비게이션
      const navigationTimer = setTimeout(() => {
        try {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          );
          console.log('네비게이션 명령 실행됨');
        } catch (error) {
          console.error('네비게이션 오류:', error);
          
          // 오류 발생 시 다시 시도
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
  }, [timePassed, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/로고.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.loadingText}>로딩 중{timePassed ? '...' : ''}</Text>
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