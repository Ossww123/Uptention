// src/pages/Products/ProductDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./ProductDetailPage.css";

const API_BASE_URL = "https://j12d211.p.ssafy.io";

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { itemId } = useParams();
  
  // 상품 데이터 상태
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 상품 상세 정보 로드
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        
        // 토큰 가져오기
        const token = localStorage.getItem("auth-token");
        if (!token) {
          throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");
        }

        const response = await axios.get(`${API_BASE_URL}/api/items/${itemId}`, {
          headers: {
            'Authorization': `${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setProduct(response.data);
        
      } catch (error) {
        console.error("상품 정보 로드 중 오류 발생:", error);
        
        let errorMessage = "상품 정보를 불러오는데 실패했습니다.";
        if (error.response) {
          if (error.response.status === 404) {
            errorMessage = "존재하지 않는 상품입니다.";
          } else if (error.response.status === 401) {
            errorMessage = "인증이 만료되었습니다. 다시 로그인해주세요.";
            setTimeout(() => navigate('/login'), 1000);
          }
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [itemId, navigate]);

  // 수정 페이지로 이동
  const handleEdit = () => {
    navigate(`/admin/products/edit/${itemId}`);
  };

  // 목록으로 돌아가기
  const handleBack = () => {
    navigate('/admin/products');
  };

  // 로딩 중 표시
  if (loading) {
    return (
      <div className="product-detail">
        <div className="content-card">
          <h1 className="page-title">상품 상세</h1>
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>상품 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 표시
  if (error) {
    return (
      <div className="product-detail">
        <div className="content-card">
          <h1 className="page-title">상품 상세</h1>
          <div className="error-message">{error}</div>
          <div className="form-actions">
            <button
              type="button"
              className="back-button"
              onClick={handleBack}
            >
              목록
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail">
      <div className="content-card">
        <h1 className="page-title">상품 상세</h1>
        
        <div className="sub-title">상품 정보</div>
        
        <div className="product-info">
          <table className="info-table">
            <tbody>
              {/* 카테고리 */}
              <tr>
                <td className="label-cell">
                  <label>카테고리</label>
                </td>
                <td className="value-cell">
                  {product.categoryName || "-"}
                </td>
              </tr>
              
              {/* 상품명 */}
              <tr>
                <td className="label-cell">
                  <label>상품명</label>
                </td>
                <td className="value-cell">
                  {product.name || "-"}
                </td>
              </tr>
              
              {/* 브랜드명 */}
              <tr>
                <td className="label-cell">
                  <label>브랜드명</label>
                </td>
                <td className="value-cell">
                  {product.brand || "-"}
                </td>
              </tr>
              
              {/* 가격 */}
              <tr>
                <td className="label-cell">
                  <label>가격</label>
                </td>
                <td className="value-cell price-cell">
                  {product.price ? `${product.price} WORK` : "-"}
                </td>
              </tr>
              
              {/* 재고량 */}
              <tr>
                <td className="label-cell">
                  <label>재고량</label>
                </td>
                <td className="value-cell">
                  {product.quantity || "-"}
                </td>
              </tr>
              
              {/* 상품설명 */}
              <tr>
                <td className="label-cell">
                  <label>상품설명</label>
                </td>
                <td className="value-cell">
                  {product.detail || "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="sub-title">상품 이미지</div>
        
        <div className="image-preview-section">
          <div className="image-preview-container">
            {product.images && product.images.length > 0 ? (
              <div className="product-images">
                {product.images.map((imageUrl, index) => (
                  <div key={index} className="product-image-item">
                    <img 
                      src={imageUrl} 
                      alt={`상품 이미지 ${index + 1}`} 
                      className="product-image"
                    />
                    <div className="image-caption">
                      {index === 0 ? '대표 이미지' : `추가 이미지 ${index}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-images-message">등록된 이미지가 없습니다</div>
            )}
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="back-button"
            onClick={handleBack}
          >
            목록
          </button>
          <button
            type="button"
            className="edit-button"
            onClick={handleEdit}
          >
            수정
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;