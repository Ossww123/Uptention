// src/pages/Products/ProductManagementPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductManagementPage.css';

const ProductManagementPage = () => {
  const navigate = useNavigate();
  
  // 검색어 상태
  const [searchTerm, setSearchTerm] = useState('');
  
  // 더미 데이터: 상품 목록
  const [products, setProducts] = useState([
    { id: '1233122', name: '가나초콜릿', brand: '롯데', category: '식품', price: '0.5' },
    { id: '4566789', name: '블루투스 이어폰', brand: '삼성', category: '가전디지털', price: '2.0' },
    { id: '7891234', name: '향수', brand: '디올', category: '뷰티', price: '3.5' },
    { id: '5671234', name: '몽블랑 펜', brand: '몽블랑', category: '문화여가', price: '1.8' },
    { id: '9876543', name: '아기용 장난감', brand: '피셔프라이스', category: '키즈', price: '0.7' },
  ]);
  
  // 상품 검색 핸들러
  const handleSearch = (e) => {
    e.preventDefault();
    // 실제로는 API 호출로 검색 기능 구현
    console.log('검색어:', searchTerm);
  };
  
  // 상품 추가 페이지로 이동
  const handleAddProduct = () => {
    navigate('/admin/products/create');
  };
  
  // 상품 수정 페이지로 이동
  const handleEditProduct = (productId) => {
    navigate(`/admin/products/edit/${productId}`);
  };
  
  // 상품 삭제 핸들러
  const handleDeleteProduct = (productId) => {
    if (window.confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      // 실제로는 API 호출로 삭제 기능 구현
      console.log('삭제할 상품 ID:', productId);
      
      // 임시로 프론트엔드에서 상품 목록에서 제거
      setProducts(products.filter(product => product.id !== productId));
    }
  };
  
  return (
    <div className="product-management">
      <div className="content-card">
        <h1 className="page-title">상품 관리</h1>
        
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="상품명 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">검색</button>
          </form>
          
          <button 
            className="add-button"
            onClick={handleAddProduct}
          >
            추가
          </button>
        </div>
        
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>상품ID</th>
                <th>상품명</th>
                <th>브랜드명</th>
                <th>카테고리</th>
                <th>가격(WORK)</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.brand}</td>
                  <td>{product.category}</td>
                  <td>{product.price}</td>
                  <td className="action-buttons">
                    <button 
                      className="edit-button"
                      onClick={() => handleEditProduct(product.id)}
                    >
                      수정
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 페이지네이션 (실제 구현 시 추가) */}
        <div className="pagination">
          <button className="pagination-button">&lt;</button>
          <button className="pagination-button active">1</button>
          <button className="pagination-button">2</button>
          <button className="pagination-button">3</button>
          <button className="pagination-button">&gt;</button>
        </div>
      </div>
    </div>
  );
};

export default ProductManagementPage;