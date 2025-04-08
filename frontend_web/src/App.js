// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/Login/LoginPage';
import UserManagementPage from './pages/Users/UserManagementPage';
import UserCreatePage from './pages/Users/UserCreatePage';
import ProductManagementPage from './pages/Products/ProductManagementPage';
import ProductCreatePage from './pages/Products/ProductCreatePage';
import ProductEditPage from './pages/Products/ProductEditPage';
import ProductDetailPage from './pages/Products/ProductDetailPage';
import AppManagementPage from './pages/Apps/AppManagementPage';
import AdminLayout from './components/layout/AdminLayout/AdminLayout';
import NotFoundPage from './pages/NotFound/NotFoundPage';

// 임시 인증 상태 체크 함수 (나중에 실제 인증 로직으로 대체)
const isAuthenticated = () => {
  // 로컬 스토리지에서 토큰 확인
  const token = localStorage.getItem('auth-token');
  return !!token; // 토큰이 있으면 true, 없으면 false 반환
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
        
        {/* 상품 관리 라우트 */}
        <Route 
          path="/admin/products" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ProductManagementPage />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/products/create" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ProductCreatePage />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* 상품 수정 라우트 추가 */}
        <Route 
          path="/admin/products/edit/:itemId" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ProductEditPage />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* 상품 조회 라우트 추가 */}
        <Route 
          path="/admin/products/:itemId" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ProductDetailPage />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* 앱 관리 라우트 */}
        <Route 
          path="/admin/apps" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AppManagementPage />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* 루트 경로는 회원 관리 페이지로 리다이렉트 */}
        <Route path="/" element={<Navigate to="/admin/users" />} />
        
        {/* 404 페이지 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;