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

// 정렬 옵션
const sortOptions = [
  { id: "SALES", name: "인기 순" },
  { id: "LOW_PRICE", name: "가격 낮은순" },
  { id: "HIGH_PRICE", name: "가격 높은순" },
];

const categoryIcons = {
  1: require("../../assets/category1.png"),
  2: require("../../assets/category2.png"),
  3: require("../../assets/category3.png"),
  4: require("../../assets/category4.png"),
  5: require("../../assets/category5.png"),
  6: require("../../assets/category6.png"),
  7: require("../../assets/category7.png"),
  8: require("../../assets/category8.png")
};

// 메모이제이션된 카테고리 아이템 컴포넌트
const CategoryItem = memo(({ item, isSelected, onSelect }) => {
  // 해당 카테고리의 아이콘이 없으면 기본 아이콘 사용
  const categoryIcon = categoryIcons[item.categoryId] || require("../../assets/category1.png");

  return (
    <TouchableOpacity
      style={[styles.sidebarCategoryItem, isSelected && styles.selectedCategory]}
      onPress={() => onSelect(item.categoryId)}
    >
      <Image 
        source={categoryIcon} 
        style={styles.categoryIcon} 
      />
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );
});

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
  const [categories, setCategories] = useState([]);
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
  // 요청 타입을 구분하기 위한 ref 추가
  const requestTypeRef = useRef(null);
  const loadRequestedRef = useRef(false);
  // ProductGridView의 FlatList ref 추가
  const productListRef = useRef(null);

   // 카테고리 로드 함수 추가
   const fetchCategories = async () => {
    try {
      const { data, ok } = await get('/category');
      
      if (ok && data && data.length > 0) {
        setCategories(data);
      } else {
        throw new Error('카테고리를 불러오지 못했습니다.');
      }
    } catch (error) {
      console.error('카테고리 로드 오류:', error);
      Alert.alert('오류', '카테고리를 불러오는 중 문제가 발생했습니다.');
    }
  };

  // 첫 마운트 시에만 실행되는 useEffect
  useEffect(() => {
    // 최초 1회만 실행되는 초기화 코드
    fetchCategories();
    fetchCartItemCount();

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (onEndReachedTimeoutRef.current) {
        clearTimeout(onEndReachedTimeoutRef.current);
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
      // 요청 타입을 설정하여 카테고리/정렬 변경임을 표시
      requestTypeRef.current = 'filter_change';
      loadProducts(true);
      
      // 스크롤 위치를 최상단으로 리셋
      scrollToTop();
    }
  }, [selectedCategory, currentSort.id]);

  // 스크롤 위치를 최상단으로 이동하는 함수
  const scrollToTop = useCallback(() => {
    if (productListRef.current) {
      console.log("스크롤 위치 최상단으로 이동");
      // FlatList를 최상단으로 스크롤
      productListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, []);

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
          requestTypeRef.current = 'initial_load';
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
        // 검색 요청임을 표시
        requestTypeRef.current = 'search';
        loadProducts(true);
        // 검색 시에도 스크롤 위치를 최상단으로 리셋
        scrollToTop();
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
      const requestType = requestTypeRef.current || 'default';
      
      console.log(`loadProducts 시작 (${callId}, ${requestType})`, {
        isRefresh,
        loading,
        hasNextPage,
        currentApiCallId: currentApiCallIdRef.current
      });

      // 추가된 체크: 스크롤 타입이고 이미 로딩 중이면 즉시 반환
    if (requestType === 'scroll' && loading) {
      console.log(`이미 로딩 중이고 스크롤 요청임, 요청 무시 (${callId}, ${requestType})`);
      return;
    }

      // 카테고리 변경, 검색, 초기 로드의 경우 무조건 실행하도록 수정
    const isUserInitiatedAction = ['filter_change', 'search', 'initial_load'].includes(requestType);
    
    // 진행 중인 API 호출이 있고, 유저가 직접 요청한 액션이 아닌 경우에만 중복 요청 방지
    if (loading && currentApiCallIdRef.current && !isUserInitiatedAction) {
      console.log(`이미 로딩 중이고 사용자 액션이 아님, 요청 무시 (${callId}, ${requestType})`);
      return;
    }
      
      // 유저 액션인 경우 이전 API 호출 취소 로직을 추가할 수 있음
      if (isUserInitiatedAction && currentApiCallIdRef.current) {
        console.log(`사용자 액션으로 인한 새 요청, 이전 요청 우선순위 낮춤 (${callId}, ${requestType})`);
        // 여기서 실제 API 취소는 어렵지만, 결과를 무시하는 로직을 추가할 수 있음
      }

      // 다음 페이지가 없고 리프레시가 아니고 유저 액션이 아닌 경우 무시
      if (!hasNextPage && !isRefresh && !isUserInitiatedAction) {
        console.log(`다음 페이지 없음, 요청 무시 (${callId}, ${requestType})`);
        return;
      }

      // 현재 API 호출 ID 설정
      currentApiCallIdRef.current = callId;
      
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
        console.log(`API 요청 URL (${callId}, ${requestType}):`, endpoint);

        // API 요청
        const { data, ok } = await get(endpoint);

        // 에러 처리
        if (!ok) {
          throw new Error(data.message || "상품을 불러오지 못했습니다.");
        }

        // API 호출이 완료됐을 때 현재 진행 중인 호출 ID와 일치하는지 확인
        // 다른 요청이 중간에 들어왔다면 결과를 무시
        if (currentApiCallIdRef.current !== callId) {
          console.log(`API 응답이 왔지만 다른 요청이 진행 중, 결과 무시 (${callId}, ${requestType})`);
          return;
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
        console.log(`loadProducts 완료 (${callId}, ${requestType})`);
      } catch (error) {
        console.error(`상품 로드 에러 (${callId}, ${requestType}):`, error);
        Alert.alert(
          "오류",
          error.message || "상품을 불러오는데 문제가 발생했습니다."
        );
      } finally {
        // 현재 API 호출 ID와 일치할 때만 로딩 상태 변경
        if (currentApiCallIdRef.current === callId) {
          setLoading(false);
          setRefreshing(false);
          currentApiCallIdRef.current = null;
        }
      }
    } catch (error) {
      console.error(`loadProducts 예외 처리 (${Date.now()}):`, error);
      setLoading(false);
      setRefreshing(false);
      currentApiCallIdRef.current = null;
    } finally {
      // 요청 타입 초기화
      requestTypeRef.current = null;
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
    // 검색 요청임을 표시
    requestTypeRef.current = 'search';
    loadProducts(true);
    // 검색 시 스크롤 위치를 최상단으로 리셋
    scrollToTop();
  }, [scrollToTop]);

  // 무한 스크롤 처리 (디바운싱 적용)
  const handleEndReached = useCallback(() => {
    // 이미 로딩 중이거나, 다음 페이지가 없거나, 타임아웃이 이미 설정된 경우 중단
    if (loading || !hasNextPage || onEndReachedTimeoutRef.current) {
      return;
    }
  
    onEndReachedTimeoutRef.current = setTimeout(() => {
      // 무한 스크롤 요청임을 표시
      requestTypeRef.current = 'scroll';
      loadProducts(false);
      // 타임아웃 레퍼런스 초기화
      onEndReachedTimeoutRef.current = null;
    }, 300); // 시간을 조금 늘려 더 안정적으로 만듦
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
        isSelected={selectedCategory === item.categoryId}
        onSelect={handleCategorySelect}
      />
    ),
    [selectedCategory, handleCategorySelect, categories]
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
            maxLength={50}
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
              keyExtractor={(item) => `category-${item.categoryId}`}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={false}
            />
          </View>
        )}

        {/* 상품 그리드 - 별도 컴포넌트로 분리 */}
        <ProductGridView
          ref={productListRef}
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