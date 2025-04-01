// src/services/AuthService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';

// 토큰 저장
export const saveToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('토큰 저장 오류:', error);
    return false;
  }
};

// 토큰 불러오기
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('토큰 불러오기 오류:', error);
    return null;
  }
};

// 사용자 ID 저장
export const saveUserId = async (userId) => {
  try {
    await AsyncStorage.setItem(USER_ID_KEY, userId);
    return true;
  } catch (error) {
    console.error('사용자 ID 저장 오류:', error);
    return false;
  }
};

// 사용자 ID 불러오기
export const getUserId = async () => {
  try {
    return await AsyncStorage.getItem(USER_ID_KEY);
  } catch (error) {
    console.error('사용자 ID 불러오기 오류:', error);
    return null;
  }
};

// 로그아웃 (모든 인증 데이터 삭제)
export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_ID_KEY]);
    return true;
  } catch (error) {
    console.error('인증 데이터 삭제 오류:', error);
    return false;
  }
};

// JWT 토큰 파싱 함수
export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT 파싱 오류:', error);
    return null;
  }
};