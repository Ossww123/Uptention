// src/components/layout/AdminLayout/AdminLayout.jsx
import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-content-wrapper">
        <Header />
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;