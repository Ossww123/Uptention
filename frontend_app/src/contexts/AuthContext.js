// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getToken, 
  saveToken, 
  getUserId,
  saveUserId,
  clearAuthData,
  parseJwt
} from '../services/AuthService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [authToken, setAuthToken] = useState(null); // 토큰 상태 추가
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 사용자 데이터 로드 함수
  const loadUserData = async () => {
    try {
      const storedUserId = await getUserId();
      const token = await getToken();
      
      if (token) {
        setAuthToken(token);
        
        // userId가 저장되어 있지 않다면 토큰에서 추출
        if (!storedUserId) {
          const payload = parseJwt(token);
          if (payload && payload.userId) {
            const extractedUserId = payload.userId.toString();
            await saveUserId(extractedUserId);
            setUserId(extractedUserId);
            console.log('토큰에서 추출한 userId:', extractedUserId);
            return { userId: extractedUserId, token };
          }
        } else {
          setUserId(storedUserId);
          console.log('저장된 userId:', storedUserId);
          return { userId: storedUserId, token };
        }
      }
      console.log('저장된 데이터 없음 - userId:', storedUserId, 'token:', token);
      return null;
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
      return null;
    }
  };

  // 로그인 함수
  const login = async (token, id) => {
    try {
      // 토큰에서 userId 추출 (id가 제공되지 않은 경우)
      if (!id) {
        const payload = parseJwt(token);
        if (payload && payload.userId) {
          id = payload.userId.toString();
        } else {
          throw new Error('토큰에서 사용자 ID를 추출할 수 없습니다');
        }
      }
      
      // 토큰과 사용자 ID 저장
      const tokenSaved = await saveToken(token);
      const userIdSaved = await saveUserId(id);
      
      if (tokenSaved && userIdSaved) {
        setUserId(id);
        setAuthToken(token);
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('로그인 처리 오류:', error);
      return false;
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      await clearAuthData();
      setUserId(null);
      setAuthToken(null);
      setIsAuthenticated(false);
      return true;
    } catch (error) {
      console.error('로그아웃 처리 오류:', error);
      return false;
    }
  };

  // 인증 상태 초기화
  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const storedUserId = await getUserId();
      
      if (token) {
        setAuthToken(token);
        
        // 저장된 userId가 있으면 사용, 없으면 토큰에서 추출
        let id = storedUserId;
        if (!id) {
          const payload = parseJwt(token);
          if (payload && payload.userId) {
            id = payload.userId.toString();
            await saveUserId(id);
          }
        }
        
        if (id) {
          setUserId(id);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('인증 초기화 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 인증 상태 초기화
  useEffect(() => {
    initializeAuth();
  }, []);

  // 제공할 컨텍스트 값
  const value = {
    userId,
    authToken,
    setAuthToken,
    setUserId,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAuth: initializeAuth,
    loadUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};