import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import ProductGridView from "../components/ProductGridView";
import { get } from '../services/api';

// 화면 너비 가져오기
const { width } = Dimensions.get("window");

// 카테고리 데이터
const categories = [
  { id: "1", name: "가전디지털", icon: require("../../assets/category1.png") },
  { id: "3", name: "뷰티", icon: require("../../assets/category2.png") },
  { id: "2", name: "리빙/키친", icon: require("../../assets/category3.png") },
  {
    id: "4",
    name: "패션의류/잡화",
    icon: require("../../assets/category4.png"),
  },
  { id: "5", name: "문화여가", icon: require("../../assets/category5.png") },
  { id: "6", name: "생활용품", icon: require("../../assets/category6.png") },
  { id: "7", name: "식품", icon: require("../../assets/category7.png") },
  { id: "8", name: "키즈", icon: require("../../assets/category8.png") },
];

// 정렬 옵션
const sortOptions = [
  { id: "SALES", name: "인기 순" },
  { id: "LOW_PRICE", name: "가격 낮은순" },
  { id: "HIGH_PRICE", name: "가격 높은순" },
];

// 메모이제이션된 카테고리 아이템 컴포넌트
const CategoryItem = memo(({ item, isSelected, onSelect }) => (
  <TouchableOpacity
    style={[styles.sidebarCategoryItem, isSelected && styles.selectedCategory]}
    onPress={() => onSelect(item.id)}
  >
    <Image source={item.icon} style={styles.categoryIcon} />
    <Text style={styles.categoryName}>{item.name}</Text>
  </TouchableOpacity>
));

// 메모이제이션된 정렬 옵션 아이템 컴포넌트
const SortOptionItem = memo(({ option, isSelected, onSelect }) => (
  <TouchableOpacity
    style={[styles.sortOption, isSelected && styles.selectedSortOption]}
    onPress={() => onSelect(option)}
  >
    <Text
      style={[
        styles.sortOptionText,
        isSelected && styles.selectedSortOptionText,
      ]}
    >
      {option.name}
    </Text>
    {isSelected && <Ionicons name="checkmark" size={16} color="#FF8C00" />}
  </TouchableOpacity>
));

const StoreScreen = ({ navigation }) => {
  // 상태 관리
  const [showCategories, setShowCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [currentSort, setCurrentSort] = useState(sortOptions[0]);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  // 고유 키 생성을 위한 타임스탬프
  const [timestamp, setTimestamp] = useState(Date.now());

  // 검색 텍스트를 저장하기 위한 ref
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const onEndReachedTimeoutRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const currentApiCallIdRef = useRef(null);
  const requestTimerRef = useRef(null);
  const loadRequestedRef = useRef(false);
  const productGridRef = useRef(null);

  // 첫 마운트 시에만 실행되는 useEffect
  useEffect(() => {
    // 최초 1회만 실행되는 초기화 코드
    fetchCartItemCount();

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (onEndReachedTimeoutRef.current) {
        clearTimeout(onEndReachedTimeoutRef.current);
      }
      if (requestTimerRef.current) {
        clearTimeout(requestTimerRef.current);
      }
    };
  }, []);

  // 첫 마운트 플래그
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 선택된 카테고리나 정렬 옵션이 변경될 때만 실행
  useEffect(() => {
    if (isMounted.current && !isInitialLoadRef.current) {
      // 최초 로드가 아니고, 마운트된 상태일 때만 실행
      console.log("카테고리/정렬 변경으로 인한 로드");
      loadProducts(true);
    }
  }, [selectedCategory, currentSort.id]);

  // 화면에 포커스가 될 때만 실행
  useFocusEffect(
    useCallback(() => {
      console.log("useFocusEffect 실행됨", {
        productsLength: products.length,
        isInitialLoad: isInitialLoadRef.current,
        loadRequested: loadRequestedRef.current
      });

      // 이전에 이미 요청했는지 확인
      if (!loadRequestedRef.current) {
        if (isInitialLoadRef.current) {
          console.log("최초 로드 실행");
          loadRequestedRef.current = true; // 요청 플래그 설정
          loadProducts(true);
          isInitialLoadRef.current = false;
        } else {
          console.log("이미 로드됨, 장바구니만 갱신");
          fetchCartItemCount();
        }
      } else {
        console.log("이전 포커스 이벤트에서 이미 로드 요청됨, 중복 요청 방지");
      }

      setTimestamp(Date.now());
      
      // 화면이 언마운트되면 로드 요청 플래그 초기화
      return () => {
        loadRequestedRef.current = false;
      };
    }, []) // 의존성 배열 비움
  );

  // 검색어 변경 시 디바운스 적용
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (isMounted.current && !isInitialLoadRef.current) {
        loadProducts(true);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText]);

  // 장바구니 개수 가져오기
  const fetchCartItemCount = async () => {
    try {
      const { data, ok } = await get('/shopping-cart/count');

      if (!ok) {
        throw new Error("장바구니 개수 조회에 실패했습니다.");
      }

      setCartItemCount(data);
    } catch (error) {
      console.error("장바구니 개수 조회 오류:", error);
      // 오류 발생 시 기본값으로 0 설정 (UI에 아무것도 표시하지 않음)
      setCartItemCount(0);
    }
  };

  // API에서 상품 데이터 로드
  const loadProducts = async (isRefresh = false) => {
    try {
      const callId = Date.now(); // 각 호출의 고유 ID
      console.log(`loadProducts 시작 (${callId})`, {
        isRefresh,
        loading,
        hasNextPage,
        currentApiCallId: currentApiCallIdRef.current,
        requestTimer: requestTimerRef.current !== null
      });

      // 더블 요청 방지 타이머 체크
      if (requestTimerRef.current) {
        console.log(`더블 요청 방지 타이머 활성화, 요청 무시 (${callId})`);
        return;
      }

      // 진행 중인 API 호출 체크
      if (loading || currentApiCallIdRef.current) {
        console.log(`이미 로딩 중, 요청 무시 (${callId})`);
        return;
      }

      // 더블 요청 방지 타이머 설정 (300ms로 조정)
      requestTimerRef.current = setTimeout(() => {
        requestTimerRef.current = null;
      }, 300); // 300ms로 변경

      // 현재 API 호출 ID 설정
      currentApiCallIdRef.current = callId;

      // 다음 페이지가 없고 리프레시가 아닐 경우 무시
      if (!hasNextPage && !isRefresh) {
        console.log(`다음 페이지 없음, 요청 무시 (${callId})`);
        currentApiCallIdRef.current = null; // ID 초기화
        return;
      }

      setLoading(true);
      if (isRefresh) {
        setRefreshing(true);
        setNextCursor(null);
      }

      try {
        // API 요청 파라미터 구성
        let params = { size: 8 };

        // 카테고리 필터 추가
        if (selectedCategory) {
          params.categoryId = selectedCategory;
        }

        // 검색어 필터 추가
        if (searchText.trim()) {
          params.keyword = searchText.trim();
        }

        // 정렬 옵션 추가
        params.sort = currentSort.id;

        // 커서 추가 (다음 페이지 로드 시)
        if (nextCursor && !isRefresh) {
          params.cursor = nextCursor;
        }

        // 쿼리 파라미터 URL로 인코딩
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          queryParams.append(key, value);
        });

        const endpoint = `/items?${queryParams.toString()}`;
        console.log(`API 요청 URL (${callId}):`, endpoint);

        // API 요청
        const { data, ok } = await get(endpoint);

        // 에러 처리
        if (!ok) {
          throw new Error(data.message || "상품을 불러오지 못했습니다.");
        }

        // 유효한 itemId를 가진 항목만 필터링
        const validItems = data.items.filter((item) => item.itemId);

        if (isRefresh) {
          setProducts(validItems);
          // 새로고침 시 타임스탬프도 갱신하여 키 값 새로 생성
          setTimestamp(Date.now());
        } else {
          setProducts((prev) => [...prev, ...validItems]);
        }

        setHasNextPage(data.hasNextPage);
        setNextCursor(data.nextCursor);
        console.log(`loadProducts 완료 (${callId})`);
      } catch (error) {
        console.error(`상품 로드 에러 (${callId}):`, error);
        Alert.alert(
          "오류",
          error.message || "상품을 불러오는데 문제가 발생했습니다."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        // API 호출 완료 후 ID 초기화
        currentApiCallIdRef.current = null;
      }
    } catch (error) {
      console.error(`loadProducts 예외 처리 (${Date.now()}):`, error);
      setLoading(false);
      setRefreshing(false);
      currentApiCallIdRef.current = null; // 예외 발생 시에도 ID 초기화
      if (requestTimerRef.current) {
        clearTimeout(requestTimerRef.current);
        requestTimerRef.current = null;
      }
    }
  };

  // 카테고리 선택 처리
  const handleCategorySelect = useCallback(
    (categoryId) => {
      if (selectedCategory === categoryId) {
        setSelectedCategory(null);
      } else {
        setSelectedCategory(categoryId);
      }
      // 카테고리 변경 시 스크롤 초기화
      if (productGridRef.current) {
        productGridRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    },
    [selectedCategory]
  );

  // 정렬 옵션 선택 처리
  const handleSortSelect = useCallback((sortOption) => {
    setCurrentSort(sortOption);
    setShowSortOptions(false);
  }, []);

  // 검색 제출 처리
  const handleSearch = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
    loadProducts(true);
  }, []);

  // 무한 스크롤 처리 (디바운싱 적용)
  const handleEndReached = useCallback(() => {
    if (onEndReachedTimeoutRef.current) {
      clearTimeout(onEndReachedTimeoutRef.current);
    }

    onEndReachedTimeoutRef.current = setTimeout(() => {
      loadProducts(false);
    }, 200);
  }, [loading, hasNextPage]);

  // 상품 상세 페이지로 이동
  const navigateToProductDetail = useCallback(
    (productId) => {
      // 화면 전환 전에 UI 렌더링 완료를 위한 지연
    setTimeout(() => {
      navigation.navigate("ProductDetail", { productId });
    }, 100); // 지연 시간 증가
    },
    [navigation]
  );

  // 장바구니로 이동
  const navigateToCart = useCallback(() => {
    navigation.navigate("Cart");
  }, [navigation]);

  // 카테고리 아이콘 렌더링
  const renderCategoryIcon = useCallback(() => {
    return (
      <TouchableOpacity
        style={styles.tagIcon}
        onPress={() => setShowCategories(!showCategories)}
      >
        <Image
          source={require("../../assets/tag-icon.png")}
          style={{
            width: 30,
            height: 30,
            tintColor: showCategories ? "#FF8C00" : "#888",
          }}
        />
      </TouchableOpacity>
    );
  }, [showCategories]);

  // 카테고리 아이템 렌더링
  const renderCategoryItem = useCallback(
    ({ item }) => (
      <CategoryItem
        item={item}
        isSelected={selectedCategory === item.id}
        onSelect={handleCategorySelect}
      />
    ),
    [selectedCategory, handleCategorySelect]
  );

  // 정렬 옵션 드롭다운 렌더링
  const renderSortDropdown = useCallback(() => {
    if (!showSortOptions) return null;

    return (
      <View style={styles.sortDropdown}>
        {sortOptions.map((option) => (
          <SortOptionItem
            key={option.id}
            option={option}
            isSelected={currentSort.id === option.id}
            onSelect={handleSortSelect}
          />
        ))}
      </View>
    );
  }, [showSortOptions, currentSort, handleSortSelect]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 검색바 및 장바구니 아이콘 */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="검색어를 입력하세요"
            placeholderTextColor="#aaa"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchText("")}
            >
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.cartIcon} onPress={navigateToCart}>
          <Image
            source={require("../../assets/cart-icon.png")}
            style={{ width: 24, height: 24 }}
          />
          {/* 장바구니 아이템 개수 표시 */}
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 필터/정렬 옵션 */}
      <View style={styles.filterContainer}>
        {renderCategoryIcon()}
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <Text style={styles.sortButtonText}>
            {currentSort.id === "LOW_PRICE" || currentSort.id === "HIGH_PRICE"
              ? "↑↓ "
              : ""}
            {currentSort.name}
          </Text>
          <Ionicons
            name={showSortOptions ? "chevron-up" : "chevron-down"}
            size={16}
            color="#FF8C00"
            style={{ marginLeft: 5 }}
          />
        </TouchableOpacity>
      </View>

      {/* 정렬 드롭다운 */}
      {renderSortDropdown()}

      {/* 메인 컨텐츠 영역: 카테고리 사이드바 + 상품 목록 */}
      <View style={styles.contentContainer}>
        {/* 카테고리 사이드바 */}
        {showCategories && (
          <View style={styles.sidebar}>
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => `category-${item.id}`}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={false}
            />
          </View>
        )}

        {/* 상품 그리드 - 별도 컴포넌트로 분리 */}
        <ProductGridView
          ref={productGridRef}
          products={products}
          onProductPress={navigateToProductDetail}
          onEndReached={handleEndReached}
          loading={loading}
          refreshing={refreshing}
          onRefresh={() => loadProducts(true)}
          timestamp={timestamp}
          selectedCategory={selectedCategory}
          currentSort={currentSort}
          searchText={searchText}
          imageWidth={Math.round((width) / 2)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchContainer: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    marginRight: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
  },
  clearButton: {
    padding: 5,
  },
  cartIcon: {
    padding: 5,
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "red",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tagIcon: {
    padding: 5,
  },
  sortButton: {
    borderWidth: 1,
    borderColor: "#FF8C00",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  sortButtonText: {
    color: "#FF8C00",
    fontSize: 14,
  },
  sortDropdown: {
    position: 'absolute', // 절대 위치 지정
    top: 120, // 필터 컨테이너 아래에 위치하도록 조정
    left: 15,
    right: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000, // 다른 요소 위에 표시되도록
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  selectedSortOption: {
    backgroundColor: "#FFF5E6",
  },
  sortOptionText: {
    fontSize: 14,
    color: "#333",
  },
  selectedSortOptionText: {
    color: "#FF8C00",
    fontWeight: "500",
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: width * 0.22, // 화면 너비의 22% 차지
    borderRightWidth: 1,
    borderRightColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  sidebarCategoryItem: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  selectedCategory: {
    backgroundColor: "#FFF5E6",
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 5,
  },
  categoryName: {
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
    color: "#333",
  },
});

export default StoreScreen;