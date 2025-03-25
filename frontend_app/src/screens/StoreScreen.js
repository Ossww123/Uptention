import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';

// 화면 너비 가져오기
const { width } = Dimensions.get("window");

// 카테고리 데이터
const categories = [
  { id: "1", name: "가전디지털", icon: require("../../assets/category1.png") },
  { id: "2", name: "뷰티", icon: require("../../assets/category2.png") },
  { id: "3", name: "리빙/키친", icon: require("../../assets/category3.png") },
  { id: "4", name: "패션의류/잡화", icon: require("../../assets/category4.png") },
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

const StoreScreen = ({ navigation }) => {
  // 상태 관리
  const [showCategories, setShowCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [currentSort, setCurrentSort] = useState(sortOptions[0]);
  const [showSortOptions, setShowSortOptions] = useState(false);
  
  // 검색 텍스트를 저장하기 위한 ref
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // 컴포넌트 마운트 시 상품 로드
  useEffect(() => {
    loadProducts(true);
  }, [selectedCategory, currentSort.id]);

  // 검색어 변경 시 디바운스 적용
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      loadProducts(true);
    }, 500);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText]);

  // API에서 상품 데이터 로드
  const loadProducts = async (isRefresh = false) => {
    try {
      // 이미 로딩 중이거나, 다음 페이지가 없는데 리프레시가 아닌 경우 리턴
      if ((loading && !isRefresh) || (!hasNextPage && !isRefresh)) return;

      setLoading(true);
      if (isRefresh) {
        setRefreshing(true);
        setNextCursor(null);
      }

      // API 요청 URL 구성
      let url = `https://j12d211.o.ssafy.io/api/items?size=8`;
      
      // 카테고리 필터 추가
      if (selectedCategory) {
        url += `&categoryId=${selectedCategory}`;
      }
      
      // 검색어 필터 추가
      if (searchText.trim()) {
        url += `&keyword=${encodeURIComponent(searchText.trim())}`;
      }
      
      // 정렬 옵션 추가
      url += `&sort=${currentSort.id}`;
      
      // 커서 추가 (다음 페이지 로드 시)
      if (nextCursor && !isRefresh) {
        url += `&cursor=${nextCursor}`;
      }

      console.log('API 요청 URL:', url);
      
      // 실제 API 요청 (fetch 사용)
      const response = await fetch(url);
      const data = await response.json();
      
      // 에러 처리
      if (data.code) {
        throw new Error(data.message || '상품을 불러오지 못했습니다.');
      }

      if (isRefresh) {
        setProducts(data.items);
      } else {
        setProducts(prev => [...prev, ...data.items]);
      }
      
      setHasNextPage(data.hasNextPage);
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error('상품 로드 에러:', error);
      Alert.alert('오류', error.message || '상품을 불러오는데 문제가 발생했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 카테고리 선택 처리
  const handleCategorySelect = (categoryId) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
    }
  };

  // 정렬 옵션 선택 처리
  const handleSortSelect = (sortOption) => {
    setCurrentSort(sortOption);
    setShowSortOptions(false);
  };

  // 검색 제출 처리
  const handleSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
    loadProducts(true);
  };

  // 카테고리 아이콘 렌더링
  const renderCategoryIcon = () => {
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
  };

  // 카테고리 아이템 렌더링
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.sidebarCategoryItem,
        selectedCategory === item.id && styles.selectedCategory,
      ]}
      onPress={() => handleCategorySelect(item.id)}
    >
      <Image source={item.icon} style={styles.categoryIcon} />
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  // 상품 아이템 렌더링
  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => navigation.navigate("ProductDetail", { productId: item.itemId })}
    >
      <Image 
        source={{ uri: item.thumbnail || 'https://via.placeholder.com/150' }} 
        style={styles.productImage}
        defaultSource={require("../../assets/product-placeholder.png")}
      />
      <Text style={styles.productBrand}>{item.brand}</Text>
      <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.productPrice}>{item.price} WORK</Text>
      {item.quantity <= 5 && (
        <Text style={styles.lowStockText}>품절 임박! ({item.quantity}개 남음)</Text>
      )}
    </TouchableOpacity>
  );

  // 리스트 푸터 (로딩 인디케이터)
  const renderFooter = () => {
    if (!loading || refreshing) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#FF8C00" />
        <Text style={styles.loadingText}>상품을 불러오는 중...</Text>
      </View>
    );
  };

  // 빈 리스트일 때 표시할 컴포넌트
  const renderEmpty = () => {
    if (loading && !refreshing) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={50} color="#ccc" />
        <Text style={styles.emptyText}>
          {searchText ? '검색 결과가 없습니다.' : '상품이 없습니다.'}
        </Text>
        <Text style={styles.emptySubText}>
          {searchText ? '다른 검색어로 시도해보세요.' : '다른 카테고리를 선택해보세요.'}
        </Text>
      </View>
    );
  };

  // 정렬 옵션 드롭다운 렌더링
  const renderSortDropdown = () => {
    if (!showSortOptions) return null;
    
    return (
      <View style={styles.sortDropdown}>
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.sortOption,
              currentSort.id === option.id && styles.selectedSortOption,
            ]}
            onPress={() => handleSortSelect(option)}
          >
            <Text
              style={[
                styles.sortOptionText,
                currentSort.id === option.id && styles.selectedSortOptionText,
              ]}
            >
              {option.name}
            </Text>
            {currentSort.id === option.id && (
              <Ionicons name="checkmark" size={16} color="#FF8C00" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 검색바 및 장바구니 아이콘 */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#888" style={styles.searchIcon} />
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
              onPress={() => setSearchText('')}
            >
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.cartIcon}
          onPress={() => navigation.navigate('Cart')}
        >
          <Image
            source={require("../../assets/cart-icon.png")}
            style={{ width: 24, height: 24 }}
          />
          {/* 장바구니 아이템 개수 표시 (선택사항) */}
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>2</Text>
          </View>
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
            {currentSort.id === 'LOW_PRICE' || currentSort.id === 'HIGH_PRICE' 
              ? '↑↓ ' 
              : ''}
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
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* 상품 그리드 */}
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.itemId.toString()}
          numColumns={2}
          contentContainerStyle={[
            styles.productList,
            products.length === 0 && styles.emptyListContainer,
          ]}
          style={styles.productsGrid}
          onEndReached={() => loadProducts(false)}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshing={refreshing}
          onRefresh={() => loadProducts(true)}
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
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
    backgroundColor: "#fff",
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  selectedSortOption: {
    backgroundColor: '#FFF5E6',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedSortOptionText: {
    color: '#FF8C00',
    fontWeight: '500',
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
    borderRadius: 20,
  },
  categoryName: {
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
    color: "#333",
  },
  productsGrid: {
    flex: 1,
  },
  productList: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  productItem: {
    flex: 1,
    margin: 5,
    marginBottom: 20,
  },
  productImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  productBrand: {
    fontSize: 12,
    color: "#888",
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    marginVertical: 2,
    height: 36, // 2줄 높이 제한
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 3,
  },
  lowStockText: {
    fontSize: 12,
    color: 'red',
    marginTop: 5,
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#888',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default StoreScreen;