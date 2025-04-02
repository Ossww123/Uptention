// src/pages/Products/ProductEditPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./ProductEditPage.css";

const API_BASE_URL = "https://j12d211.p.ssafy.io";

const ProductEditPage = () => {
  const navigate = useNavigate();
  const { itemId } = useParams(); // URL에서 상품 ID 추출
  
  // 상품 데이터 상태
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 수정 가능한 필드만 별도 관리
  const [editableFields, setEditableFields] = useState({
    price: "",
    detail: "",
    quantity: ""
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

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
        
        const productData = response.data;
        setProduct(productData);
        
        // 수정 가능한 필드 초기화
        setEditableFields({
          price: productData.price || "",
          detail: productData.detail || "",
          quantity: productData.quantity || ""
        });
        
      } catch (error) {
        console.error("상품 정보 로드 중 오류 발생:", error);
        
        let errorMessage = "상품 정보를 불러오는데 실패했습니다.";
        if (error.response) {
          if (error.response.status === 404) {
            errorMessage = "존재하지 않는 상품입니다.";
          } else if (error.response.status === 401) {
            errorMessage = "인증이 만료되었습니다. 다시 로그인해주세요.";
            // 로그인 페이지로 리다이렉트
            setTimeout(() => navigate('/login'), 1000);
          }
        }
        
        setErrors({ global: errorMessage });
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [itemId, navigate]);

  // 입력 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setEditableFields({
      ...editableFields,
      [name]: name === "price" || name === "quantity" 
        ? value === "" ? "" : parseInt(value, 10) 
        : value
    });
    
    // 입력 값 변경 시 해당 필드의 에러 메시지 초기화
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
    
    // 성공 메시지가 있다면 초기화
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  // 유효성 검사
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // price 유효성 검사
    if (editableFields.price !== "" && editableFields.price !== null) {
      if (isNaN(editableFields.price)) {
        newErrors.price = "유효한 가격을 입력해 주세요";
        isValid = false;
      } else if (editableFields.price < 1) {
        newErrors.price = "가격은 1원 이상이어야 합니다";
        isValid = false;
      } else if (editableFields.price > 5000) {
        newErrors.price = "가격은 5000원 이하여야 합니다";
        isValid = false;
      }
    }
    
    // detail 유효성 검사
    if (editableFields.detail !== "" && editableFields.detail !== null) {
      if (editableFields.detail.length > 255) {
        newErrors.detail = "상품 설명은 255자 이내로 입력해 주세요";
        isValid = false;
      }
    }
    
    // quantity 유효성 검사
    if (editableFields.quantity !== "" && editableFields.quantity !== null) {
      if (isNaN(editableFields.quantity) || !Number.isInteger(Number(editableFields.quantity))) {
        newErrors.quantity = "유효한 재고량을 입력해 주세요 (양의 정수)";
        isValid = false;
      } else if (editableFields.quantity < 1) {
        newErrors.quantity = "재고량은 1개 이상이어야 합니다";
        isValid = false;
      } else if (editableFields.quantity > 99) {
        newErrors.quantity = "재고량은 최대 99개까지 입력 가능합니다";
        isValid = false;
      }
    }
    
    // 최소 하나의 필드가 변경되었는지 확인
    const isAnyFieldChanged = 
      (editableFields.price !== "" && editableFields.price !== product.price) ||
      (editableFields.detail !== "" && editableFields.detail !== product.detail) ||
      (editableFields.quantity !== "" && editableFields.quantity !== product.quantity);
    
    if (!isAnyFieldChanged) {
      newErrors.global = "변경된 내용이 없습니다";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!validateForm()) {
      // 에러 발생 시 페이지 상단으로 스크롤
      window.scrollTo(0, 0);
      return;
    }
    
    try {
      setSubmitting(true);
      
      // 토큰 가져오기
      const token = localStorage.getItem("auth-token");
      if (!token) {
        throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");
      }
      
      // 변경된 필드만 요청에 포함
      const updateData = {};
      
      if (editableFields.price !== "" && editableFields.price !== product.price) {
        updateData.price = editableFields.price;
      }
      
      if (editableFields.detail !== "" && editableFields.detail !== product.detail) {
        updateData.detail = editableFields.detail;
      }
      
      if (editableFields.quantity !== "" && editableFields.quantity !== product.quantity) {
        updateData.quantity = editableFields.quantity;
      }
      
      // API 호출
      const response = await axios.patch(
        `${API_BASE_URL}/api/items/${itemId}`,
        updateData,
        {
          headers: {
            'Authorization': `${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // 성공 처리
      setSuccessMessage("상품이 성공적으로 수정되었습니다.");
      
      // 상품 데이터 업데이트
      setProduct({
        ...product,
        ...updateData
      });
      
      // 성공 후 3초 뒤 상품 목록 페이지로 이동
      setTimeout(() => {
        navigate('/admin/products');
      }, 3000);
      
    } catch (error) {
      console.error("상품 수정 오류:", error);
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400) {
          // 유효성 검사 오류 처리
          if (data.message.includes("price")) {
            setErrors(prev => ({ ...prev, price: data.message }));
          } else if (data.message.includes("detail")) {
            setErrors(prev => ({ ...prev, detail: data.message }));
          } else if (data.message.includes("quantity")) {
            setErrors(prev => ({ ...prev, quantity: data.message }));
          } else {
            setErrors(prev => ({ ...prev, global: data.message || "입력 정보를 확인해주세요" }));
          }
        } else if (status === 404) {
          setErrors(prev => ({ ...prev, global: "상품을 찾을 수 없습니다" }));
        } else if (status === 401) {
          setErrors(prev => ({ ...prev, global: "인증이 만료되었습니다. 다시 로그인해주세요." }));
          // 로그인 페이지로 리다이렉트
          setTimeout(() => navigate('/login'), 1000);
        } else {
          setErrors(prev => ({ ...prev, global: "상품 수정 중 오류가 발생했습니다" }));
        }
      } else {
        setErrors(prev => ({ ...prev, global: "서버와 통신 중 오류가 발생했습니다" }));
      }
      
      // 에러 발생 시 페이지 상단으로 스크롤
      window.scrollTo(0, 0);
    } finally {
      setSubmitting(false);
    }
  };

  // 취소 버튼 핸들러
  const handleCancel = () => {
    if (window.confirm("수정을 취소하시겠습니까?")) {
      navigate('/admin/products');
    }
  };

  // 로딩 중 표시
  if (loading) {
    return (
      <div className="product-edit">
        <div className="content-card">
          <h1 className="page-title">상품 수정</h1>
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>상품 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 상품 정보 로드 실패 시
  if (!product && !loading) {
    return (
      <div className="product-edit">
        <div className="content-card">
          <h1 className="page-title">상품 수정</h1>
          <div className="error-message">{errors.global || "상품 정보를 불러오는데 실패했습니다."}</div>
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/admin/products')}
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-edit">
      <div className="content-card">
        <h1 className="page-title">상품 수정</h1>
        
        {/* 전역 에러 메시지 표시 */}
        {errors.global && <div className="form-error-message">{errors.global}</div>}
        
        {/* 성공 메시지 표시 */}
        {successMessage && <div className="form-success-message">{successMessage}</div>}
        
        <div className="sub-title">상품 정보</div>
        
        <form onSubmit={handleSubmit}>
          <table className="form-table">
            <tbody>
              {/* 카테고리 (수정 불가) */}
              <tr>
                <td className="label-cell">
                  <label>카테고리</label>
                </td>
                <td className="input-cell">
                  <div className="non-editable-field">
                    <input
                      type="text"
                      value={product.categoryName || ""}
                      className="form-input disabled"
                      disabled
                    />
                  </div>
                </td>
              </tr>
              
              {/* 상품명 (수정 불가) */}
              <tr>
                <td className="label-cell">
                  <label>상품명</label>
                </td>
                <td className="input-cell">
                  <div className="non-editable-field">
                    <input
                      type="text"
                      value={product.name || ""}
                      className="form-input disabled"
                      disabled
                    />
                  </div>
                </td>
              </tr>
              
              {/* 브랜드명 (수정 불가) */}
              <tr>
                <td className="label-cell">
                  <label>브랜드명</label>
                </td>
                <td className="input-cell">
                  <div className="non-editable-field">
                    <input
                      type="text"
                      value={product.brand || ""}
                      className="form-input disabled"
                      disabled
                    />
                  </div>
                </td>
              </tr>
              
              {/* 가격 (수정 가능) */}
              <tr>
                <td className="label-cell">
                  <label>가격</label>
                </td>
                <td className="input-cell price-cell">
                  <input
                    type="number"
                    name="price"
                    value={editableFields.price}
                    onChange={handleChange}
                    className="form-input price-input"
                    min="1"
                    max="5000"
                    placeholder={product.price}
                  />
                  <span className="price-currency">WORK</span>
                  {errors.price && <div className="error-message">{errors.price}</div>}
                  <div className="field-hint">1~5000 사이의 값을 입력하세요</div>
                </td>
              </tr>
              
              {/* 재고량 (수정 가능) */}
              <tr>
                <td className="label-cell">
                  <label>재고량</label>
                </td>
                <td className="input-cell">
                  <input
                    type="number"
                    name="quantity"
                    value={editableFields.quantity}
                    onChange={handleChange}
                    className="form-input"
                    min="1"
                    max="99"
                    step="1"
                    placeholder={product.quantity}
                  />
                  {errors.quantity && <div className="error-message">{errors.quantity}</div>}
                  <div className="field-hint">1~99 사이의 정수를 입력하세요</div>
                </td>
              </tr>
              
              {/* 상품설명 (수정 가능) */}
              <tr>
                <td className="label-cell">
                  <label>상품설명</label>
                </td>
                <td className="input-cell">
                  <textarea
                    name="detail"
                    value={editableFields.detail}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder={product.detail || "상품 설명을 입력하세요"}
                    maxLength="255"
                    rows="5"
                  />
                  {errors.detail && <div className="error-message">{errors.detail}</div>}
                  <div className="char-count">{editableFields.detail.length}/255</div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div className="sub-title">상품 이미지</div>
          
          <div className="image-preview-section">
            <div className="image-preview-container">
              {product.images && product.images.length > 0 ? (
                <div className="product-images">
                  {product.images.map((imageUrl, index) => (
                    <div key={index} className="product-image-item">
                      <div className="non-editable-field">
                        <img 
                          src={imageUrl} 
                          alt={`상품 이미지 ${index + 1}`} 
                          className="product-image"
                        />
                      </div>
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
              className="cancel-button"
              onClick={handleCancel}
              disabled={submitting}
            >
              취소
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={submitting}
            >
              {submitting ? "처리 중..." : "수정"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEditPage;