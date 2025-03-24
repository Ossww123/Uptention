// src/pages/Users/UserCreatePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserCreatePage.css';

const UserCreatePage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    category: '',
    productName: '',
    brandName: '',
    price: '0.0',
    description: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 유효성 검사
    const newErrors = {};
    if (!formData.category) {
      newErrors.category = '카테고리를 선택해 주세요';
    }
    if (!formData.productName) {
      newErrors.productName = '상품명을 입력해 주세요';
    }
    if (!formData.brandName) {
      newErrors.brandName = '브랜드명을 입력해 주세요';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // 여기에 API 호출 로직 추가 (실제 구현 시)
    console.log('제출할 데이터:', formData);
    
    // 성공 시 회원 목록 페이지로 리다이렉트
    alert('상품이 등록되었습니다.');
    navigate('/admin/users');
  };
  
  const handleCancel = () => {
    if (window.confirm('작성 중인 내용이 있습니다. 취소하시겠습니까?')) {
      navigate('/admin/users');
    }
  };
  
  return (
    <div className="user-create">
      <div className="content-card">
        <h1 className="page-title">회원 등록</h1>
        
        <div className="sub-title">회원 정보</div>
        
        <form onSubmit={handleSubmit}>
          <table className="form-table">
            <tbody>
              <tr>
                <td className="label-cell">
                  <label>카테고리<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <select 
                    name="category" 
                    value={formData.category}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">선택해 주세요</option>
                    <option value="category1">카테고리 1</option>
                    <option value="category2">카테고리 2</option>
                    <option value="category3">카테고리 3</option>
                  </select>
                  {errors.category && <div className="error-message">{errors.category}</div>}
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>상품명<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <input 
                    type="text" 
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="상품명 입력(최대 30자)"
                    maxLength="30"
                  />
                  {errors.productName && <div className="error-message">{errors.productName}</div>}
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>브랜드명<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <input 
                    type="text" 
                    name="brandName"
                    value={formData.brandName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="브랜드명 입력(최대 30자)"
                    maxLength="30"
                  />
                  {errors.brandName && <div className="error-message">{errors.brandName}</div>}
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>가격<span className="required">*</span></label>
                </td>
                <td className="input-cell price-cell">
                  <input 
                    type="number" 
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="form-input price-input"
                    step="0.1"
                    min="0"
                  />
                  <span className="price-currency">WORK</span>
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>상품설명<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="상품설명 입력(최대 255자)"
                    maxLength="255"
                    rows="5"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={handleCancel}
            >
              취소
            </button>
            <button 
              type="submit" 
              className="submit-button"
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserCreatePage;