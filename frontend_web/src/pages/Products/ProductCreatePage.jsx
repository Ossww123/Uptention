// src/pages/Products/ProductCreatePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProductCreatePage.css';

const API_BASE_URL = 'https://j12d211.p.ssafy.io';

const ProductCreatePage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    brand: '',
    price: '',
    detail: '',
    quantity: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [mainImage, setMainImage] = useState(null);
  const [mainImageFile, setMainImageFile] = useState(null);
  const [subImages, setSubImages] = useState([null, null]);
  const [subImageFiles, setSubImageFiles] = useState([null, null]);
  
  // 카테고리 목록
  const categories = [
    { id: "1", name: "가전디지털" },
    { id: "2", name: "뷰티" },
    { id: "3", name: "리빙/키친" },
    { id: "4", name: "패션의류/잡화" },
    { id: "5", name: "문화여가" },
    { id: "6", name: "생활용품" },
    { id: "7", name: "식품" },
    { id: "8", name: "키즈" },
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'quantity' || name === 'categoryId' 
        ? value === '' ? '' : parseInt(value, 10)
        : value
    });
  };
  
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 이미지 파일 저장
      setMainImageFile(file);
      
      // 미리보기 URL 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubImageChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      // 이미지 파일 저장
      const newSubImageFiles = [...subImageFiles];
      newSubImageFiles[index] = file;
      setSubImageFiles(newSubImageFiles);
      
      // 미리보기 URL 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        const newSubImages = [...subImages];
        newSubImages[index] = reader.result;
        setSubImages(newSubImages);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.categoryId) {
      newErrors.categoryId = '카테고리를 선택해 주세요';
    }
    
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = '상품명을 입력해 주세요';
    } else if (formData.name.length > 30) {
      newErrors.name = '상품명은 30자 이내로 입력해 주세요';
    }
    
    if (!formData.brand || formData.brand.trim() === '') {
      newErrors.brand = '브랜드명을 입력해 주세요';
    } else if (formData.brand.length > 30) {
      newErrors.brand = '브랜드명은 30자 이내로 입력해 주세요';
    }
    
    if (!formData.price && formData.price !== 0) {
      newErrors.price = '가격을 입력해 주세요';
    } else if (isNaN(formData.price) || formData.price < 0) {
      newErrors.price = '유효한 가격을 입력해 주세요';
    }
    
    if (!formData.quantity && formData.quantity !== 0) {
      newErrors.quantity = '재고량을 입력해 주세요';
    } else if (isNaN(formData.quantity) || formData.quantity < 0 || !Number.isInteger(Number(formData.quantity))) {
      newErrors.quantity = '유효한 재고량을 입력해 주세요 (양의 정수)';
    }
    
    if (!formData.detail || formData.detail.trim() === '') {
      newErrors.detail = '상품 설명을 입력해 주세요';
    } else if (formData.detail.length > 255) {
      newErrors.detail = '상품 설명은 255자 이내로 입력해 주세요';
    }
    
    if (!mainImageFile) {
      newErrors.mainImage = '대표 이미지는 필수입니다';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // 토큰 가져오기
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
      }
      
      // FormData 생성
      const formDataToSend = new FormData();
      
      // 상품 정보를 JSON 문자열로 변환하여 추가
      const itemData = {
        categoryId: parseInt(formData.categoryId),
        name: formData.name,
        brand: formData.brand,
        price: parseInt(formData.price),
        detail: formData.detail,
        quantity: parseInt(formData.quantity)
      };
      
      // JSON 문자열을 Blob으로 변환하여 FormData에 추가
      const itemBlob = new Blob([JSON.stringify(itemData)], { type: 'application/json' });
      formDataToSend.append('item', itemBlob);
      
      // 이미지 파일 추가
      if (mainImageFile) {
        formDataToSend.append('images', mainImageFile);
      }
      
      // 서브 이미지 추가 (존재하는 것만)
      subImageFiles.forEach(file => {
        if (file) {
          formDataToSend.append('images', file);
        }
      });
      
      // API 호출
      const response = await axios.post(`${API_BASE_URL}/api/items`, formDataToSend, {
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log(response);
      
      // 성공 메시지 표시
      alert('상품이 성공적으로 등록되었습니다.');
      
      // 상품 목록 페이지로 이동
      navigate('/admin/products');
    } catch (error) {
      console.error('상품 등록 오류:', error);
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400) {
          alert(`잘못된 요청: ${data.message || '입력 정보를 확인해주세요'}`);
        } else if (status === 404) {
          alert(`오류: ${data.message || '카테고리가 존재하지 않습니다'}`);
        } else {
          alert(`상품 등록 실패: ${data.message || '서버 오류가 발생했습니다'}`);
        }
      } else {
        alert('상품 등록 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    if (window.confirm('작성 중인 내용이 있습니다. 취소하시겠습니까?')) {
      navigate('/admin/products');
    }
  };
  
  return (
    <div className="product-create">
      <div className="content-card">
        <h1 className="page-title">상품 등록</h1>
        
        <div className="sub-title">상품 정보</div>
        
        <form onSubmit={handleSubmit}>
          <table className="form-table">
            <tbody>
              <tr>
                <td className="label-cell">
                  <label>카테고리<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <select 
                    name="categoryId" 
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">선택해 주세요</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && <div className="error-message">{errors.categoryId}</div>}
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>상품명<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="상품명 입력(최대 30자)"
                    maxLength="30"
                  />
                  {errors.name && <div className="error-message">{errors.name}</div>}
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>브랜드명<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <input 
                    type="text" 
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="브랜드명 입력(최대 30자)"
                    maxLength="30"
                  />
                  {errors.brand && <div className="error-message">{errors.brand}</div>}
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
                    min="0"
                    placeholder="숫자만 입력"
                  />
                  <span className="price-currency">WORK</span>
                  {errors.price && <div className="error-message">{errors.price}</div>}
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>재고량<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <input 
                    type="number" 
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="form-input"
                    min="0"
                    step="1"
                    placeholder="숫자만 입력 (정수)"
                  />
                  {errors.quantity && <div className="error-message">{errors.quantity}</div>}
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>상품설명<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <textarea 
                    name="detail"
                    value={formData.detail}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="상품설명 입력(최대 255자)"
                    maxLength="255"
                    rows="5"
                  />
                  {errors.detail && <div className="error-message">{errors.detail}</div>}
                  <div className="char-count">{formData.detail.length}/255</div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div className="sub-title">상품 이미지</div>
          
          <table className="form-table">
            <tbody>
              <tr>
                <td className="label-cell">
                  <label>대표이미지<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <div className="image-upload-area">
                    <div className="image-upload-box">
                      {mainImage ? (
                        <div className="image-preview">
                          <img src={mainImage} alt="대표 이미지" />
                          <button 
                            type="button" 
                            onClick={() => {
                              setMainImage(null);
                              setMainImageFile(null);
                            }}
                            className="remove-image-btn"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <>
                          <input 
                            type="file" 
                            id="main-image" 
                            accept="image/*" 
                            onChange={handleMainImageChange} 
                            hidden
                          />
                          <label htmlFor="main-image" className="image-upload-btn">
                            <div className="camera-icon">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF6B6B">
                                <path d="M9,3L7.17,5H4C2.9,5 2,5.9 2,7V19C2,20.1 2.9,21 4,21H20C21.1,21 22,20.1 22,19V7C22,5.9 21.1,5 20,5H16.83L15,3H9M12,18C9.24,18 7,15.76 7,13C7,10.24 9.24,8 12,8C14.76,8 17,10.24 17,13C17,15.76 14.76,18 12,18M12,17C14.08,17 15.8,15.28 15.8,13.2C15.8,11.12 14.08,9.4 12,9.4C9.92,9.4 8.2,11.12 8.2,13.2C8.2,15.28 9.92,17 12,17Z" />
                              </svg>
                            </div>
                          </label>
                        </>
                      )}
                    </div>
                    <div className="image-upload-text">
                      상품 대표이미지는 필수값 입니다.
                    </div>
                    {errors.mainImage && <div className="error-message">{errors.mainImage}</div>}
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>서브이미지<br />(최대 2개)</label>
                </td>
                <td className="input-cell">
                  <div className="image-upload-area">
                    <div className="sub-images-container">
                      {subImages.map((img, index) => (
                        <div key={index} className="image-upload-box">
                          {img ? (
                            <div className="image-preview">
                              <img src={img} alt={`서브 이미지 ${index + 1}`} />
                              <button 
                                type="button" 
                                onClick={() => {
                                  const newSubImages = [...subImages];
                                  newSubImages[index] = null;
                                  setSubImages(newSubImages);
                                  
                                  const newSubImageFiles = [...subImageFiles];
                                  newSubImageFiles[index] = null;
                                  setSubImageFiles(newSubImageFiles);
                                }}
                                className="remove-image-btn"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <>
                              <input 
                                type="file" 
                                id={`sub-image-${index}`} 
                                accept="image/*" 
                                onChange={(e) => handleSubImageChange(e, index)} 
                                hidden
                              />
                              <label htmlFor={`sub-image-${index}`} className="image-upload-btn">
                                <div className="camera-icon">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#4CAF50">
                                    <path d="M9,3L7.17,5H4C2.9,5 2,5.9 2,7V19C2,20.1 2.9,21 4,21H20C21.1,21 22,20.1 22,19V7C22,5.9 21.1,5 20,5H16.83L15,3H9M12,18C9.24,18 7,15.76 7,13C7,10.24 9.24,8 12,8C14.76,8 17,10.24 17,13C17,15.76 14.76,18 12,18M12,17C14.08,17 15.8,15.28 15.8,13.2C15.8,11.12 14.08,9.4 12,9.4C9.92,9.4 8.2,11.12 8.2,13.2C8.2,15.28 9.92,17 12,17Z" />
                                  </svg>
                                </div>
                              </label>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="label-cell"></td>
                <td className="input-cell image-note">
                  <ul>
                    <li>정사각형 이미지 사용 (360 X 360 권장)</li>
                    <li>JPG, JPEG, PNG 형식 파일 등록</li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={handleCancel}
              disabled={loading}
            >
              취소
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? '처리 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductCreatePage;