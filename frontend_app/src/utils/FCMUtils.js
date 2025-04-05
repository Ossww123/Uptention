// src/utils/FCMUtils.js
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FCM_TOKEN_KEY = 'fcm_token';

/**
 * Firebase Cloud Messaging 관련 유틸리티 함수
 */
export const FCMUtils = {
  /**
   * FCM 토큰 초기화 및 요청
   * @returns {Promise<string>} FCM 토큰
   */
  async initializeFCM() {
    try {
      // iOS에서는 권한 요청이 필요함
      await this.requestPermission();
      
      // 기존 토큰 가져오기 시도
      let fcmToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      
      // 기존 토큰이 없으면 새로 요청
      if (!fcmToken) {
        fcmToken = await messaging().getToken();
        if (fcmToken) {
          await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);
          console.log('New FCM Token generated and stored:', fcmToken);
        }
      } else {
        console.log('Existing FCM Token found:', fcmToken);
      }
      
      // 토큰 변경 이벤트 리스너
      this.setupTokenRefreshListener();
      
      return fcmToken;
    } catch (error) {
      console.error('FCM 초기화 오류:', error);
      return null;
    }
  },
  
  /**
   * FCM 권한 요청 (iOS 필수)
   */
  async requestPermission() {
    // try {
    //   const authStatus = await messaging().requestPermission();
    //   const enabled =
    //     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    //     authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
    //   if (enabled) {
    //     console.log('FCM 권한 허용됨');
    //   } else {
    //     console.log('FCM 권한 거부됨');
    //   }
      
    //   return enabled;
    // } catch (error) {
    //   console.error('FCM 권한 요청 오류:', error);
    //   return false;
    // }

    // 안드로이드 환경에서는 권한 요청이 기본적으로 필요 없음
    if (Platform.OS === 'ios') {
        // iOS 코드는 그대로 유지
        const authStatus = await messaging().requestPermission();
        const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        return enabled;
    }
    return true; // 안드로이드는 항상 true 반환
  },
  
  /**
   * 토큰 갱신 리스너 설정
   */
  setupTokenRefreshListener() {
    return messaging().onTokenRefresh(async (fcmToken) => {
      try {
        await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);
        console.log('FCM 토큰 갱신됨:', fcmToken);
      } catch (error) {
        console.error('FCM 토큰 갱신 저장 오류:', error);
      }
    });
  },
  
  /**
   * 저장된 FCM 토큰 가져오기
   * @returns {Promise<string>} 저장된 FCM 토큰
   */
  async getFCMToken() {
    try {
      const token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      // 토큰이 없으면 다시 초기화
      if (!token) {
        return await this.initializeFCM();
      }
      return token;
    } catch (error) {
      console.error('FCM 토큰 가져오기 오류:', error);
      return null;
    }
  },
  
  /**
   * FCM 토큰 강제 삭제 (로그아웃 등에 활용)
   */
  async clearFCMToken() {
    try {
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
      console.log('FCM 토큰 삭제됨');
    } catch (error) {
      console.error('FCM 토큰 삭제 오류:', error);
    }
  }
};

export default FCMUtils;