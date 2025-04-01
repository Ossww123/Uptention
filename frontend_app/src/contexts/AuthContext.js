import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, saveToken } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // JWT 토큰에서 payload를 추출하는 함수
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('JWT 파싱 오류:', error);
      return null;
    }
  };

  // 로그인 함수
  const login = async (token, id) => {
    try {
      await saveToken(token);
      await AsyncStorage.setItem('userId', id);
      setAuthToken(token);
      setUserId(id);
      return true;
    } catch (error) {
      console.error('로그인 오류:', error);
      return false;
    }
  };

  // 사용자 데이터 로드
  const loadUserData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const token = await getToken();
      
      if (token) {
        setAuthToken(token);
        
        if (!storedUserId) {
          const payload = parseJwt(token);
          if (payload && payload.userId) {
            const extractedUserId = payload.userId.toString();
            await AsyncStorage.setItem('userId', extractedUserId);
            setUserId(extractedUserId);
          }
        } else {
          setUserId(storedUserId);
        }
      }
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('auth_token');
      setUserId(null);
      setAuthToken(null);
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 컴포넌트 마운트 시 사용자 데이터 로드
  useEffect(() => {
    loadUserData();
  }, []);

  const value = {
    userId,
    authToken,
    setAuthToken,
    setUserId,
    isLoading,
    login,
    logout,
    loadUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 