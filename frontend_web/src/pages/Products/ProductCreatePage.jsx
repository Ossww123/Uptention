// src/pages/Products/ProductCreatePage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProductCreatePage.css";

const API_BASE_URL = "https://j12d211.p.ssafy.io";

const ProductCreatePage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    categoryId: "",
    name: "",
    brand: "",
    price: "",
    detail: "",
    quantity: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // 이미지 관련 상태
  const [mainImage, setMainImage] = useState(null);
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImageInfo, setMainImageInfo] = useState(null);
  const [subImages, setSubImages] = useState([null, null]);
  const [subImageFiles, setSubImageFiles] = useState([null, null]);
  const [subImagesInfo, setSubImagesInfo] = useState([null, null]);
  const [showPreviewDetails, setShowPreviewDetails] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null); // 선택된 이미지 인덱스 (-1: 메인, 0,1: 서브)

  // 이미지 처리 관련 상수
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"];

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

    if (name === "quantity") {
      // 음수와 0을 방지
      let processedValue = value;
      
      // 음수 부호 입력 방지
      if (processedValue.startsWith('-')) {
        processedValue = processedValue.substring(1);
      }
      
      // 0만 입력된 경우 빈 문자열로 설정
      if (/^0+$/.test(processedValue)) {
        processedValue = '';
      }
      // 앞자리에 0이 있는 경우 제거 (예: "01" -> "1")
      else if (processedValue.startsWith('0') && processedValue.length > 1) {
        processedValue = processedValue.replace(/^0+/, '');
      }
      
      // 허용 범위 검사 (1-99)
      const numValue = parseInt(processedValue, 10);
      if (!isNaN(numValue) && numValue > 99) {
        processedValue = '99';
      }
      
      setFormData({
        ...formData,
        [name]: processedValue
      });
    } 
    else if (name === "price") {
      // 음수와 0을 방지
      let processedValue = value;
      
      // 음수 부호 입력 방지
      if (processedValue.startsWith('-')) {
        processedValue = processedValue.substring(1);
      }
      
      // 0만 입력된 경우 빈 문자열로 설정
      if (/^0+$/.test(processedValue)) {
        processedValue = '';
      }
      // 앞자리에 0이 있는 경우 제거 (예: "01" -> "1")
      else if (processedValue.startsWith('0') && processedValue.length > 1) {
        processedValue = processedValue.replace(/^0+/, '');
      }
      
      // 허용 범위 검사 (1-5000)
      const numValue = parseInt(processedValue, 10);
      if (!isNaN(numValue) && numValue > 5000) {
        processedValue = '5000';
      }
      
      setFormData({
        ...formData,
        [name]: processedValue
      });
    }
    else if (name === "name" || name === "brand" || name === "detail") {
      // 이모지 제거 (상품명, 브랜드명, 상품 설명)
      const processedValue = value.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '');
      
      if (name === "detail") {
        // 줄 수 제한 로직 추가 (기존에 구현한 경우)
        const lines = processedValue.split('\n');
        const MAX_LINES = 5;
        
        if (lines.length > MAX_LINES) {
          const limitedText = lines.slice(0, MAX_LINES).join('\n');
          setFormData({
            ...formData,
            [name]: limitedText
          });
        } else {
          setFormData({
            ...formData,
            [name]: processedValue
          });
        }
      } else {
        setFormData({
          ...formData,
          [name]: processedValue
        });
      }
    }
    else {
      setFormData({
        ...formData,
        [name]: name === "categoryId"
          ? value === "" ? "" : parseInt(value, 10)
          : value,
      });
    }
  
    // 에러 메시지 초기화
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  // 이미지 파일 유효성 검사
  const validateImageFile = (file) => {
    // 파일 크기 검사
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({
        ...prev,
        imageSize: `이미지 크기는 2MB 이하여야 합니다. 현재 크기: ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)}MB`,
      }));
      return false;
    }

    // MIME 타입 검사
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        imageType: "지원하는 이미지 형식은 JPG, JPEG, PNG 입니다.",
      }));
      return false;
    }

    // 에러 메시지 초기화
    setErrors((prev) => ({
      ...prev,
      imageSize: "",
      imageType: "",
    }));

    return true;
  };

  // 이미지 중앙 크롭 미리보기 생성
  const createCenteredCropPreview = (imageUrl, callback) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      // 원본 이미지 비율 계산
      const size = Math.min(img.width, img.height);
      const xOffset = Math.floor((img.width - size) / 2);
      const yOffset = Math.floor((img.height - size) / 2);

      // 캔버스 생성 및 설정
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      // 중앙 크롭 그리기
      ctx.drawImage(
        img,
        xOffset,
        yOffset,
        size,
        size, // 소스 이미지의 중앙 부분
        0,
        0,
        size,
        size // 캔버스에 그릴 위치와 크기
      );

      // 원본 이미지 정보
      const originalInfo = {
        width: img.width,
        height: img.height,
        cropInfo: {
          x: xOffset,
          y: yOffset,
          size: size,
        },
      };

      // 결과 이미지 URL 생성 및 콜백 호출
      const croppedImageUrl = canvas.toDataURL("image/jpeg", 0.8);
      callback(croppedImageUrl, originalInfo);
    };

    img.onerror = () => {
      setErrors((prev) => ({
        ...prev,
        imageFormat: "지원하지 않는 이미지 형식이거나 손상된 이미지입니다.",
      }));
      callback(null);
    };

    img.src = imageUrl;
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 이미지 파일 유효성 검사
      if (!validateImageFile(file)) {
        return;
      }

      // 원본 파일 저장
      setMainImageFile(file);

      // 파일 읽기
      const reader = new FileReader();
      reader.onloadend = () => {
        // 중앙 크롭된 미리보기 생성
        createCenteredCropPreview(
          reader.result,
          (croppedImageUrl, originalInfo) => {
            if (croppedImageUrl) {
              setMainImage(croppedImageUrl);
              setMainImageInfo(originalInfo);
            } else {
              setMainImageFile(null);
            }
          }
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubImageChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      // 이미지 파일 유효성 검사
      if (!validateImageFile(file)) {
        return;
      }

      // 원본 파일 저장
      const newSubImageFiles = [...subImageFiles];
      newSubImageFiles[index] = file;
      setSubImageFiles(newSubImageFiles);

      // 파일 읽기
      const reader = new FileReader();
      reader.onloadend = () => {
        // 중앙 크롭된 미리보기 생성
        createCenteredCropPreview(
          reader.result,
          (croppedImageUrl, originalInfo) => {
            if (croppedImageUrl) {
              const newSubImages = [...subImages];
              newSubImages[index] = croppedImageUrl;
              setSubImages(newSubImages);

              const newSubImagesInfo = [...subImagesInfo];
              newSubImagesInfo[index] = originalInfo;
              setSubImagesInfo(newSubImagesInfo);
            } else {
              const newSubImageFiles = [...subImageFiles];
              newSubImageFiles[index] = null;
              setSubImageFiles(newSubImageFiles);
            }
          }
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    let firstErrorField = null;

    if (!formData.categoryId) {
      newErrors.categoryId = "카테고리를 선택해 주세요";
      isValid = false;
      if (!firstErrorField) firstErrorField = "categoryId";
    }

    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = "상품명을 입력해 주세요";
      isValid = false;
      if (!firstErrorField) firstErrorField = "name";
    } else if (formData.name.length > 30) {
      newErrors.name = "상품명은 30자 이내로 입력해 주세요";
      isValid = false;
      if (!firstErrorField) firstErrorField = "name";
    }

    if (!formData.brand || formData.brand.trim() === "") {
      newErrors.brand = "브랜드명을 입력해 주세요";
      isValid = false;
      if (!firstErrorField) firstErrorField = "brand";
    } else if (formData.brand.length > 30) {
      newErrors.brand = "브랜드명은 30자 이내로 입력해 주세요";
      isValid = false;
      if (!firstErrorField) firstErrorField = "brand";
    }

    if (!formData.price && formData.price !== 0) {
      newErrors.price = "가격을 입력해 주세요";
      isValid = false;
      if (!firstErrorField) firstErrorField = "price";
    } else if (isNaN(formData.price) || formData.price < 0) {
      newErrors.price = "유효한 가격을 입력해 주세요";
      isValid = false;
      if (!firstErrorField) firstErrorField = "price";
    }

    if (!formData.quantity && formData.quantity !== 0) {
      newErrors.quantity = "재고량을 입력해 주세요";
      isValid = false;
      if (!firstErrorField) firstErrorField = "quantity";
    } else if (
      isNaN(formData.quantity) ||
      formData.quantity < 0 ||
      !Number.isInteger(Number(formData.quantity))
    ) {
      newErrors.quantity = "유효한 재고량을 입력해 주세요 (양의 정수)";
      isValid = false;
      if (!firstErrorField) firstErrorField = "quantity";
    } else if (Number(formData.quantity) > 99) {
      newErrors.quantity = "재고량은 최대 99개까지 입력 가능합니다";
      isValid = false;
      if (!firstErrorField) firstErrorField = "quantity";
    }

    // 상품 설명 유효성 검사
    if (!formData.detail || formData.detail.trim() === "") {
      newErrors.detail = "상품 설명을 입력해 주세요";
      isValid = false;
      if (!firstErrorField) firstErrorField = "detail";
    } else if (formData.detail.length > 255) {
      newErrors.detail = "상품 설명은 255자 이내로 입력해 주세요";
      isValid = false;
      if (!firstErrorField) firstErrorField = "detail";
    } else {
      // 줄 수 확인
      const lineCount = formData.detail.split('\n').length;
      const MAX_LINES = 5;
      
      if (lineCount > MAX_LINES) {
        newErrors.detail = `상품 설명은 최대 ${MAX_LINES}줄까지만 입력 가능합니다`;
        isValid = false;
        if (!firstErrorField) firstErrorField = "detail";
      }
      
      // 이모지 확인
      if (/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu.test(formData.detail)) {
        newErrors.detail = "상품 설명에 이모지를 사용할 수 없습니다";
        isValid = false;
        if (!firstErrorField) firstErrorField = "detail";
      }
    }

    if (!mainImageFile) {
      newErrors.mainImage = "대표 이미지는 필수입니다";
      isValid = false;
      firstErrorField = "mainImage";
    }

    setErrors(newErrors);
    
    // 에러가 있는 첫 번째 필드로 스크롤
    if (!isValid && firstErrorField) {
      setTimeout(() => {
        let errorField;
        
        if (firstErrorField === "mainImage") {
          // 메인 이미지 에러일 경우 이미지 업로드 영역으로 스크롤
          errorField = document.querySelector(".image-upload-box");
        } else {
          // 일반 필드 에러
          errorField = document.querySelector(`[name="${firstErrorField}"]`);
        }
        
        if (errorField) {
          errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (errorField.focus && firstErrorField !== "mainImage") {
            errorField.focus();
          }
        }
      }, 100);
    }
    
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 유효성 검사
    if (!validateForm()) {
      // validateForm 내부에서 스크롤 처리
      return;
    }

    try {
      setLoading(true);

      // 토큰 가져오기
      const token = localStorage.getItem("auth-token");
      if (!token) {
        throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");
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
        quantity: parseInt(formData.quantity),
      };

      // JSON 문자열을 Blob으로 변환하여 FormData에 추가
      const itemBlob = new Blob([JSON.stringify(itemData)], {
        type: "application/json",
      });
      formDataToSend.append("item", itemBlob);

      // 이미지 파일 추가
      if (mainImageFile) {
        formDataToSend.append("images", mainImageFile);
      }

      // 서브 이미지 추가 (존재하는 것만)
      subImageFiles.forEach((file) => {
        if (file) {
          formDataToSend.append("images", file);
        }
      });

      // API 호출
      const response = await axios.post(
        `${API_BASE_URL}/api/items`,
        formDataToSend,
        {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log(response);

      // 성공 메시지 표시
      alert("상품이 성공적으로 등록되었습니다.");

      // 상품 목록 페이지로 이동
      navigate("/admin/products");
    } catch (error) {
      console.error("상품 등록 오류:", error);

      if (error.response) {
        const { status, data } = error.response;

        if (status === 400) {
          setErrors((prev) => ({
            ...prev,
            form: `잘못된 요청: ${data.message || "입력 정보를 확인해주세요"}`
          }));
        } else if (status === 404) {
          setErrors((prev) => ({
            ...prev,
            form: `오류: ${data.message || "카테고리가 존재하지 않습니다"}`
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            form: `상품 등록 실패: ${
              data.message || "서버 오류가 발생했습니다"
            }`
          }));
        }
      } else {
        setErrors((prev) => ({
          ...prev,
          form: "상품 등록 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요."
        }));
      }

      // 에러 발생 시 페이지 상단으로 스크롤
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("작성 중인 내용이 있습니다. 취소하시겠습니까?")) {
      navigate("/admin/products");
    }
  };

  // 이미지 정보 모달 표시
  const handleShowImageInfo = (index) => {
    setSelectedImageIndex(index);
    setShowPreviewDetails(true);
  };

  // 현재 선택된 이미지의 정보 반환
  const getSelectedImageInfo = () => {
    if (selectedImageIndex === -1) {
      return {
        title: "대표 이미지",
        info: mainImageInfo,
      };
    } else if (
      selectedImageIndex >= 0 &&
      selectedImageIndex < subImagesInfo.length
    ) {
      return {
        title: `서브 이미지 ${selectedImageIndex + 1}`,
        info: subImagesInfo[selectedImageIndex],
      };
    }
    return null;
  };

  return (
    <div className="product-create">
      <div className="content-card">
        <h1 className="page-title">상품 등록</h1>

        {/* 폼 전체 에러 메시지 */}
        {errors.form && <div className="form-error-message">{errors.form}</div>}

        <div className="sub-title">상품 정보</div>

        <form onSubmit={handleSubmit}>
          <table className="form-table">
            <tbody>
              <tr>
                <td className="label-cell">
                  <label>
                    카테고리<span className="required">*</span>
                  </label>
                </td>
                <td className="input-cell">
                  <div className="input-wrapper">
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      className={`form-select ${errors.categoryId ? "has-error" : ""}`}
                    >
                      <option value="">선택해 주세요</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <div className="error-hint">{errors.categoryId}</div>
                    )}
                  </div>
                </td>
              </tr>

              <tr>
                <td className="label-cell">
                  <label>
                    상품명<span className="required">*</span>
                  </label>
                </td>
                <td className="input-cell">
                  <div className="input-wrapper">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`form-input ${errors.name ? "has-error" : ""}`}
                      placeholder="상품명 입력(최대 30자)"
                      maxLength="30"
                    />
                    {errors.name && (
                      <div className="error-hint">{errors.name}</div>
                    )}
                  </div>
                </td>
              </tr>

              <tr>
                <td className="label-cell">
                  <label>
                    브랜드명<span className="required">*</span>
                  </label>
                </td>
                <td className="input-cell">
                  <div className="input-wrapper">
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className={`form-input ${errors.brand ? "has-error" : ""}`}
                      placeholder="브랜드명 입력(최대 30자)"
                      maxLength="30"
                    />
                    {errors.brand && (
                      <div className="error-hint">{errors.brand}</div>
                    )}
                  </div>
                </td>
              </tr>

              <tr>
                <td className="label-cell">
                  <label>
                    가격<span className="required">*</span>
                  </label>
                </td>
                <td className="input-cell price-cell">
                  <div className="input-wrapper">
                    <div className="price-input-container">
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                          // e, E, +, -를 차단
                          if (['e', 'E', '+', '-'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        className={`form-input price-input ${errors.price ? "has-error" : ""}`}
                        min="1"
                        max="5000"
                        placeholder="숫자만 입력"
                      />
                      <span className="price-currency">WORK</span>
                    </div>
                    <div className="field-hint">가격 범위: 1~5000 WORK</div>
                    {errors.price && (
                      <div className="error-hint price-error">{errors.price}</div>
                    )}
                  </div>
                </td>
              </tr>

              <tr>
                <td className="label-cell">
                  <label>
                    재고량<span className="required">*</span>
                  </label>
                </td>
                <td className="input-cell price-cell">
                  <div className="input-wrapper">
                    <div className="price-input-container">
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                          // e, E, +, -를 차단
                          if (['e', 'E', '+', '-'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        className={`form-input price-input ${errors.quantity ? "has-error" : ""}`}
                        min="1"
                        max="99"
                        step="1"
                        placeholder="숫자만 입력"
                      />
                      <span className="price-currency">개</span>
                    </div>
                    <div className="field-hint">재고량 범위: 1~99개</div>
                    {errors.quantity && (
                      <div className="error-hint price-error">{errors.quantity}</div>
                    )}
                  </div>
                </td>
              </tr>

              <tr>
                <td className="label-cell">
                  <label>
                    상품설명<span className="required">*</span>
                  </label>
                </td>
                <td className="input-cell">
                  <div className="input-wrapper">
                    <textarea
                      name="detail"
                      value={formData.detail}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        // 이미 최대 줄 수에 도달했는지 확인
                        if (e.key === 'Enter') {
                          const currentLines = e.target.value.split('\n').length;
                          if (currentLines >= 5) {
                            e.preventDefault(); // 엔터 입력 방지
                          }
                        }
                      }}
                      className={`form-textarea ${errors.detail ? "has-error" : ""}`}
                      placeholder="상품설명 입력(최대 255자, 5줄 이내)"
                      maxLength="255"
                      rows="5"
                    />
                    <div className="char-count">
                      {formData.detail.split('\n').length}/{5}줄, {formData.detail.length}/{255}자
                    </div>
                    {errors.detail && (
                      <div className="error-hint">{errors.detail}</div>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="sub-title">상품 이미지</div>

                    {/* 이미지 관련 에러 메시지 */}
        {(errors.imageSize || errors.imageType || errors.imageFormat) && (
          <div className="form-error-message">
            {errors.imageSize && <p>{errors.imageSize}</p>}
            {errors.imageType && <p>{errors.imageType}</p>}
            {errors.imageFormat && <p>{errors.imageFormat}</p>}
          </div>
        )}
          <table className="form-table">
            <tbody>
              <tr>
                <td className="label-cell">
                  <label>
                    대표이미지<span className="required">*</span>
                  </label>
                </td>
                <td className="input-cell">
                  <div className="input-wrapper">
                    <div className="image-upload-area">
                      <div className="image-upload-box">
                        {mainImage ? (
                          <div className="image-preview">
                            <img src={mainImage} alt="대표 이미지" />
                            <div className="image-overlay">
                              <span className="preview-label">미리보기</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setMainImage(null);
                                setMainImageFile(null);
                                setMainImageInfo(null);
                              }}
                              className="remove-image-btn"
                            >
                              ×
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShowImageInfo(-1)}
                              className="info-image-btn"
                            >
                              <span>i</span>
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
                            <label
                              htmlFor="main-image"
                              className="image-upload-btn"
                            >
                              <div className="camera-icon">
                                <svg
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="#FF6B6B"
                                >
                                  <path d="M9,3L7.17,5H4C2.9,5 2,5.9 2,7V19C2,20.1 2.9,21 4,21H20C21.1,21 22,20.1 22,19V7C22,5.9 21.1,5 20,5H16.83L15,3H9M12,18C9.24,18 7,15.76 7,13C7,10.24 9.24,8 12,8C14.76,8 17,10.24 17,13C17,15.76 14.76,18 12,18M12,17C14.08,17 15.8,15.28 15.8,13.2C15.8,11.12 14.08,9.4 12,9.4C9.92,9.4 8.2,11.12 8.2,13.2C8.2,15.28 9.92,17 12,17Z" />
                                </svg>
                              </div>
                              <div className="upload-text">
                                <span>클릭하여 이미지 추가</span>
                                <small>권장: 360x360 (1:1 비율)</small>
                              </div>
                            </label>
                          </>
                        )}
                      </div>
                      <div className="image-upload-text">
                        상품 대표이미지는 필수값 입니다.
                      </div>
                    </div>
                    {errors.mainImage && (
                      <div className="error-hint">{errors.mainImage}</div>
                    )}
                  </div>
                </td>
              </tr>

              <tr>
                <td className="label-cell">
                  <label>
                    서브이미지
                    <br />
                    (최대 2개)
                  </label>
                </td>
                <td className="input-cell">
                  <div className="image-upload-area">
                    <div className="sub-images-container">
                      {subImages.map((img, index) => (
                        <div key={index} className="image-upload-box">
                          {img ? (
                            <div className="image-preview">
                              <img src={img} alt={`서브 이미지 ${index + 1}`} />
                              <div className="image-overlay">
                                <span className="preview-label">미리보기</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newSubImages = [...subImages];
                                  newSubImages[index] = null;
                                  setSubImages(newSubImages);

                                  const newSubImageFiles = [...subImageFiles];
                                  newSubImageFiles[index] = null;
                                  setSubImageFiles(newSubImageFiles);

                                  const newSubImagesInfo = [...subImagesInfo];
                                  newSubImagesInfo[index] = null;
                                  setSubImagesInfo(newSubImagesInfo);
                                }}
                                className="remove-image-btn"
                              >
                                ×
                              </button>
                              <button
                                type="button"
                                onClick={() => handleShowImageInfo(index)}
                                className="info-image-btn"
                              >
                                <span>i</span>
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
                              <label
                                htmlFor={`sub-image-${index}`}
                                className="image-upload-btn"
                              >
                                <div className="camera-icon">
                                  <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="#4CAF50"
                                  >
                                    <path d="M9,3L7.17,5H4C2.9,5 2,5.9 2,7V19C2,20.1 2.9,21 4,21H20C21.1,21 22,20.1 22,19V7C22,5.9 21.1,5 20,5H16.83L15,3H9M12,18C9.24,18 7,15.76 7,13C7,10.24 9.24,8 12,8C14.76,8 17,10.24 17,13C17,15.76 14.76,18 12,18M12,17C14.08,17 15.8,15.28 15.8,13.2C15.8,11.12 14.08,9.4 12,9.4C9.92,9.4 8.2,11.12 8.2,13.2C8.2,15.28 9.92,17 12,17Z" />
                                  </svg>
                                </div>
                                <div className="upload-text">
                                  <small>추가 이미지 {index + 1}</small>
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
                    <li>파일 크기는 2MB 이하여야 합니다</li>
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
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "처리 중..." : "등록"}
            </button>
          </div>
        </form>

        {/* 이미지 크롭 정보 표시 모달 */}
        {showPreviewDetails && (
          <div className="preview-details-modal">
            <div className="preview-details-content">
              <h3>이미지 크롭 미리보기 정보</h3>
      
              {(() => {
                const selectedImg = getSelectedImageInfo();
                if (selectedImg && selectedImg.info) {
                  // 이미지 소스 결정
                  const imageSrc = selectedImageIndex === -1 
                    ? mainImageFile ? URL.createObjectURL(mainImageFile) : mainImage 
                    : subImageFiles[selectedImageIndex] ? URL.createObjectURL(subImageFiles[selectedImageIndex]) : subImages[selectedImageIndex];
                  
                  return (
                    <div className="details-section">
                      <h4>{selectedImg.title}</h4>
                      <div className="image-details">
                        <p>원본 크기: {selectedImg.info.width} x {selectedImg.info.height}px</p>
                        <p>크롭 영역: {selectedImg.info.cropInfo.size} x {selectedImg.info.cropInfo.size}px</p>
                        <p>시작 위치: X={selectedImg.info.cropInfo.x}, Y={selectedImg.info.cropInfo.y}</p>
                      
                        <div className="original-image-container">
                          <h5>원본 이미지와 크롭 영역</h5>
                          <div className="original-image-wrapper" style={{
                            position: 'relative',
                            width: '100%',
                            // 원본 이미지 비율 유지
                            paddingBottom: `${(selectedImg.info.height / selectedImg.info.width) * 100}%`
                          }}>
                            {/* 원본 이미지 */}
                            <img 
                              src={imageSrc} 
                              alt="원본 이미지" 
                              className="original-image"
                            />
                            
                            {/* 크롭 영역 오버레이 */}
                            <div className="crop-overlay">
                              <div className="crop-area" style={{
                                left: `${(selectedImg.info.cropInfo.x / selectedImg.info.width) * 100}%`,
                                top: `${(selectedImg.info.cropInfo.y / selectedImg.info.height) * 100}%`,
                                width: `${(selectedImg.info.cropInfo.size / selectedImg.info.width) * 100}%`,
                                height: `${(selectedImg.info.cropInfo.size / selectedImg.info.height) * 100}%`,
                              }}></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="cropped-preview-container">
                          <h5>크롭 결과 미리보기</h5>
                          <div className="cropped-preview">
                            <img 
                              src={selectedImageIndex === -1 ? mainImage : subImages[selectedImageIndex]} 
                              alt="크롭된 이미지 미리보기" 
                              className="cropped-image"
                            />
                          </div>
                        </div>
                      </div> 
                    </div>
                  );
                } else {
                  return <p>이미지 정보가 없습니다.</p>;
                }
              })()}

              <div className="modal-footer">
                <button
                  className="close-modal-btn"
                  onClick={() => {
                    setShowPreviewDetails(false);
                    setSelectedImageIndex(null);
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCreatePage;