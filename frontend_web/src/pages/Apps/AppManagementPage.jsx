// src/pages/Apps/AppManagementPage.jsx
import React, { useState } from 'react';
import './AppManagementPage.css';

const AppManagementPage = () => {
  // 앱 목록 상태
  const [apps, setApps] = useState([
    { id: 1, name: 'Chrome', packageName: 'com.android.chrome', isAllowed: true },
    { id: 2, name: 'Gmail', packageName: 'com.google.android.gmail', isAllowed: true },
    { id: 3, name: 'YouTube', packageName: 'com.google.android.youtube', isAllowed: false },
    { id: 4, name: 'Instagram', packageName: 'com.instagram.android', isAllowed: false },
    { id: 5, name: 'Slack', packageName: 'com.slack', isAllowed: true },
    { id: 6, name: 'Microsoft Teams', packageName: 'com.microsoft.teams', isAllowed: true },
    { id: 7, name: 'Zoom', packageName: 'us.zoom.videomeetings', isAllowed: true },
    { id: 8, name: 'TikTok', packageName: 'com.zhiliaoapp.musically', isAllowed: false },
  ]);
  
  // 새 앱 상태
  const [newApp, setNewApp] = useState({ name: '', packageName: '' });
  
  // 검색어 상태
  const [searchTerm, setSearchTerm] = useState('');
  
  // 앱 차단 상태
  const [blockAllApps, setBlockAllApps] = useState(false);
  
  // 에러 상태
  const [errors, setErrors] = useState({});
  
  // 필터링된 앱 목록
  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.packageName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // 앱 허용/차단 토글
  const toggleAppAllowed = (id) => {
    setApps(apps.map(app => 
      app.id === id 
        ? { ...app, isAllowed: !app.isAllowed } 
        : app
    ));
  };
  
  // 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewApp({
      ...newApp,
      [name]: value
    });
  };
  
  // 새 앱 추가 핸들러
  const handleAddApp = (e) => {
    e.preventDefault();
    
    // 유효성 검사
    const newErrors = {};
    if (!newApp.name) {
      newErrors.name = '앱 이름을 입력해주세요';
    }
    if (!newApp.packageName) {
      newErrors.packageName = '패키지명을 입력해주세요';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // 패키지명 중복 검사
    if (apps.some(app => app.packageName === newApp.packageName)) {
      setErrors({ packageName: '이미 존재하는 패키지명입니다' });
      return;
    }
    
    const newAppWithId = {
      id: apps.length > 0 ? Math.max(...apps.map(app => app.id)) + 1 : 1,
      name: newApp.name,
      packageName: newApp.packageName,
      isAllowed: true
    };
    
    setApps([...apps, newAppWithId]);
    setNewApp({ name: '', packageName: '' });
    setErrors({});
  };
  
  // 앱 삭제 핸들러
  const handleDeleteApp = (id) => {
    if (window.confirm('정말로 이 앱을 목록에서 삭제하시겠습니까?')) {
      setApps(apps.filter(app => app.id !== id));
    }
  };
  
  // 모든 앱 차단/허용 토글
  const handleToggleBlockAllApps = () => {
    setBlockAllApps(!blockAllApps);
  };
  
  return (
    <div className="app-management">
      <div className="content-card">
        <h1 className="page-title">앱 관리</h1>
        
        {/* 전체 앱 차단 토글 */}
        <div className="block-all-section">
          <div className="sub-title">채굴 시 앱 제한 설정</div>
          
          <div className="block-all-container">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={blockAllApps}
                onChange={handleToggleBlockAllApps}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">
              {blockAllApps 
                ? '채굴 시 모든 앱 사용 제한 활성화' 
                : '채굴 시 모든 앱 사용 제한 비활성화'
              }
            </span>
          </div>
          
          <p className="block-all-description">
            앱 제한 설정이 활성화된 경우, 허용된 앱만 채굴 중에 사용 가능합니다.
            비활성화된 경우, 모든 앱을 사용할 수 있습니다.
          </p>
        </div>
        
        {/* 새 앱 추가 폼 */}
        <div className="app-add-section">
          <div className="sub-title">허용 앱 추가</div>
          
          <form onSubmit={handleAddApp} className="app-add-form">
            <div className="form-group">
              <label>앱 이름<span className="required">*</span></label>
              <input
                type="text"
                name="name"
                value={newApp.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="앱 이름 입력"
              />
              {errors.name && <div className="error-message">{errors.name}</div>}
            </div>
            
            <div className="form-group">
              <label>패키지명<span className="required">*</span></label>
              <input
                type="text"
                name="packageName"
                value={newApp.packageName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="패키지명 입력 (com.example.app)"
              />
              {errors.packageName && <div className="error-message">{errors.packageName}</div>}
            </div>
            
            <button type="submit" className="add-app-button">추가</button>
          </form>
        </div>
        
        {/* 앱 목록 */}
        <div className="app-list-section">
          <div className="sub-title">허용 앱 목록</div>
          
          <div className="search-container">
            <input
              type="text"
              placeholder="앱 이름 또는 패키지명으로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="apps-table-container">
            <table className="apps-table">
              <thead>
                <tr>
                  <th>앱 이름</th>
                  <th>패키지명</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.length > 0 ? (
                  filteredApps.map(app => (
                    <tr key={app.id}>
                      <td>{app.name}</td>
                      <td>{app.packageName}</td>
                      <td>
                        <div className="app-status">
                          <label className="toggle-switch small">
                            <input
                              type="checkbox"
                              checked={app.isAllowed}
                              onChange={() => toggleAppAllowed(app.id)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                          <span className={`status-text ${app.isAllowed ? 'allowed' : 'blocked'}`}>
                            {app.isAllowed ? '허용' : '차단'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteApp(app.id)}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-apps-message">
                      등록된 앱이 없거나 검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppManagementPage;