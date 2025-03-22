// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
// 나중에 추가될 다른 페이지들 import 예정
// import Dashboard from './pages/Dashboard/Dashboard';
// import ProductManagement from './pages/Products/ProductManagement';
// import UserManagement from './pages/Users/UserManagement';

// 임시 인증 상태 체크 함수 (나중에 실제 인증 로직으로 대체)
const isAuthenticated = () => {
  // 로컬 스토리지 등에서 토큰 확인 로직을 추가할 예정
  return false;
};

// 인증 필요한 라우트를 위한 컴포넌트
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
    return <Navigate to="/login" />;
  }
  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/login" element={<Login />} />
        
        {/* 인증이 필요한 라우트들 */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <div>대시보드 페이지 (개발 예정)</div>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/products" 
          element={
            <ProtectedRoute>
              <div>상품 관리 페이지 (개발 예정)</div>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/users" 
          element={
            <ProtectedRoute>
              <div>회원 관리 페이지 (개발 예정)</div>
            </ProtectedRoute>
          } 
        />
        
        {/* 루트 경로는 로그인 페이지로 리다이렉트 */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* 404 페이지 */}
        <Route path="*" element={<div>페이지를 찾을 수 없습니다.</div>} />
      </Routes>
    </Router>
  );
};

export default App;