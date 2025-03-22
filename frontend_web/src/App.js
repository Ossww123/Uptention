// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/Login/LoginPage';
import UserManagementPage from './pages/Users/UserManagementPage';
import UserCreatePage from './pages/Users/UserCreatePage';
import AdminLayout from './components/layout/AdminLayout/AdminLayout';

// 임시 인증 상태 체크 함수 (나중에 실제 인증 로직으로 대체)
const isAuthenticated = () => {
  // 로컬 스토리지 등에서 토큰 확인 로직을 추가할 예정
  // 개발 중에는 항상 인증된 것으로 처리
  return true;
};

// 인증 필요한 라우트를 위한 컴포넌트
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* 관리자 라우트 */}
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <UserManagementPage />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/users/create" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <UserCreatePage />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/products" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <div>상품 관리 페이지 (개발 예정)</div>
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/notifications" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <div>앱 관리 페이지 (개발 예정)</div>
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* 루트 경로는 회원 관리 페이지로 리다이렉트 */}
        <Route path="/" element={<Navigate to="/admin/users" />} />
        
        {/* 404 페이지 */}
        <Route path="*" element={<div>페이지를 찾을 수 없습니다.</div>} />
      </Routes>
    </Router>
  );
}

export default App;