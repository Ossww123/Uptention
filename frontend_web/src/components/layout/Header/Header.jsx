// src/components/layout/Header/Header.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import './Header.css';

const Header = ({ title }) => {
  const location = useLocation();

  // 현재 경로에서 페이지 제목 결정 
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path.includes('/admin/users')) {
      return '회원 관리';
    } else if (path.includes('/admin/products')) {
      return '상품 관리';
    } else if (path.includes('/admin/apps')) {
      return '앱 관리';
    }
    
    // 기본 제목 반환 또는 props로 전달된 제목 사용
    return title || '관리자 페이지';
  };

  return (
    <div className="admin-header">
      <div className="header-title">
        <h1>{getPageTitle()}</h1>
      </div>
    </div>
  );
};

export default Header;