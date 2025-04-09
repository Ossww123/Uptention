import React, { useRef, useCallback, memo } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// 메모이제이션된 상품 아이템 컴포넌트
const ProductItem = memo(({ item, onPress, imageWidth }) => {
  // 이미지 URL에 크기 파라미터 추가
  const imageUrl = item.thumbnail
    ? `${item.thumbnail}?w=${imageWidth}&h=${imageWidth}&t=cover&f=webp`
    : "https://via.placeholder.com/150";

  return (
    <TouchableOpacity style={styles.productItem} onPress={onPress}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.productImage}
        defaultSource={require("../../assets/product-placeholder.png")}
      />
      <Text style={styles.productBrand}>{item.brand}</Text>
      <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">
        {item.name}
      </Text>
      <Text style={styles.productPrice}>{item.price} WORK</Text>
      {item.quantity === 0 ? (
        <Text style={styles.lowStockText}>품절입니다.</Text>
      ) : item.quantity <= 5 ? (
        <Text style={styles.lowStockText}>
          품절 임박! ({item.quantity}개 남음)
        </Text>
      ) : null}
    </TouchableOpacity>
  );
});

const ProductGridView = memo(
  React.forwardRef(
    ({
      products,
      onProductPress,
      onEndReached,
      loading,
      refreshing,
      onRefresh,
      timestamp,
      selectedCategory,
      currentSort,
      imageWidth,
    }, ref) => {
      const flatListRef = useRef(null);

      const keyExtractor = useCallback(
        (item, index) => `product-${item.itemId || index}-${timestamp}`,
        [timestamp]
      );

      const renderFooter = useCallback(() => {
        if (!loading || refreshing) return null;

        return (
          <View style={styles.footerContainer}>
            <ActivityIndicator size="small" color="#FF8C00" />
            <Text style={styles.loadingText}>상품을 불러오는 중...</Text>
          </View>
        );
      }, [loading, refreshing]);

      const renderEmpty = useCallback((searchText) => {
        if (loading && !refreshing) return null;

        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchText ? "검색 결과가 없습니다." : "상품이 없습니다."}
            </Text>
            <Text style={styles.emptySubText}>
              {searchText
                ? "다른 검색어로 시도해보세요."
                : "다른 카테고리를 선택해보세요."}
            </Text>
          </View>
        );
      }, []);

      // 상품 렌더링 함수
      const renderItem = useCallback(
        ({ item }) => (
          <ProductItem
            item={item}
            onPress={() => onProductPress(item.itemId)}
            imageWidth={imageWidth}
          />
        ),
        [onProductPress, imageWidth]
      );

      return (
        <FlatList
          ref={ref}
          removeClippedSubviews={false}
          extraData={[selectedCategory, currentSort, timestamp]}
          data={products}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          contentContainerStyle={[
            styles.productList,
            products.length === 0 && styles.emptyListContainer,
          ]}
          style={styles.productsGrid}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.2}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={() => renderEmpty()}
          refreshing={refreshing}
          onRefresh={onRefresh}
          maxToRenderPerBatch={6}
          initialNumToRender={6}
          windowSize={5}
          scrollEnabled={true}
          onScrollToIndexFailed={() => {}}
          disableVirtualization={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          updateCellsBatchingPeriod={50}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
        />
      );
    }
  )
);

const styles = StyleSheet.create({
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
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  productItem: {
    flex: 1,
    margin: 5,
    marginBottom: 20,
  },
  productImage: {
    width: "100%",
    aspectRatio: 1, // 정사각형 비율 유지
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
  },
  productBrand: {
    fontSize: 12,
    color: "#888",
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    marginVertical: 2,
    minHeight: 36, // 최소 높이 보장
    lineHeight: 18, // 라인 간 간격 조정
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 3,
  },
  lowStockText: {
    fontSize: 12,
    color: "red",
    marginTop: 5,
  },
  footerContainer: {
    alignItems: "center",
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#888",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: "#888",
    marginTop: 5,
    textAlign: "center",
  },
});

export default ProductGridView;
