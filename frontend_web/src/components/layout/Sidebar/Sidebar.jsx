// src/components/layout/Sidebar/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import logo from '../../../assets/images/logo.png'; // 로고 이미지 경로 설정 필요

const Sidebar = () => {
  const location = useLocation();
  
  // 현재 경로에 따른 메뉴 활성화 상태 확인
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="sidebar">
      {/* 상단 주황색 영역 */}
      <div className="sidebar-orange-header"></div>
      
      {/* 로고 영역 */}
      <div className="sidebar-header">
        <div className="sidebar-logo-container">
          <img src={logo} alt="UPTENTION" className="sidebar-logo" />
          <div className="sidebar-title">UP<br />TENSION</div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <Link to="/admin/users" className={`sidebar-nav-item ${isActive('/admin/users') ? 'active' : ''}`}>
          <div className="sidebar-icon">
            <svg viewBox="0 0 24 24" fill={isActive('/admin/users') ? '#FF8C00' : 'currentColor'} width="24" height="24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <span>회원관리</span>
        </Link>
        
        <Link to="/admin/products" className={`sidebar-nav-item ${isActive('/admin/products') ? 'active' : ''}`}>
          <div className="sidebar-icon">
            <svg viewBox="0 0 24 24" fill={isActive('/admin/products') ? '#FF8C00' : 'currentColor'} width="24" height="24">
              <path d="M18.36 9l.6 3H5.04l.6-3h12.72M20 4H4v2h16V4zm0 3H4l-1 5v2h1v6h10v-6h4v6h2v-6h1v-2l-1-5zM6 18v-4h6v4H6z" />
            </svg>
          </div>
          <span>상품관리</span>
        </Link>
        
        <Link to="/admin/apps" className={`sidebar-nav-item ${isActive('/admin/apps') ? 'active' : ''}`}>
          <div className="sidebar-icon">
            <svg viewBox="0 0 24 24" fill={isActive('/admin/apps') ? '#FF8C00' : 'currentColor'} width="24" height="24">
              <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" />
            </svg>
          </div>
          <span>앱관리</span>
        </Link>
      </nav>
      
      <div className="sidebar-footer">
        <Link to="/logout" className="sidebar-logout">
          <div className="sidebar-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
          </div>
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;