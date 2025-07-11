import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  FlatList,
  Animated,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import PaymentBottomSheet from "../components/PaymentBottomSheet";
import GiftBottomSheet from "../components/GiftBottomSheet";
import { getProductDetail, addToCart, getCartItemCount } from "../api/product";

const { width } = Dimensions.get("window");

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCartMessage, setShowCartMessage] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0]; // useState로 래핑하여 재생성 방지
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showGiftSheet, setShowGiftSheet] = useState(false);

  // 더미 배송 정보 (실제로는 사용자 정보에서 가져와야 함)
  const deliveryInfo = {
    address: "경상북도 진평시 진평길 55-5",
    detail: "최강아파트 211호",
  };

  useEffect(() => {
    fetchProductDetails();
    fetchCartItemCount();

    // 하드웨어 백 버튼 처리
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    // 컴포넌트 언마운트 시 정리
    return () => {
      backHandler.remove();
      fadeAnim.stopAnimation();
    };
  }, [productId]);

  // 주소 선택 후 돌아왔을 때 PaymentBottomSheet 표시를 위한 별도의 useEffect
useEffect(() => {
  // 주소 정보가 있고 PaymentBottomSheet를 표시해야 할 경우
  if (route.params?.showPaymentSheet && route.params?.fromAddressDetail) {
    // 가져온 주소 정보 사용
    const selectedAddress = route.params.address;
    
    // PaymentBottomSheet를 표시하고 주소 정보 전달
    setShowPaymentSheet(true);
    
    // 파라미터 초기화 (중복 처리 방지)
    navigation.setParams({ 
      showPaymentSheet: undefined,
      fromAddressDetail: undefined,
      // 주소 정보는 유지
    });
  }
  // 기존 조건 유지
  else if (route.params?.showPaymentSheet) {
    setShowPaymentSheet(true);
    // showPaymentSheet 파라미터 초기화
    navigation.setParams({ showPaymentSheet: undefined });
  }
}, [route.params?.showPaymentSheet, route.params?.fromAddressDetail, route.params?.address]);

  // 화면에 포커스가 될 때마다 장바구니 개수 업데이트
  useFocusEffect(
    useCallback(() => {
      fetchCartItemCount();

      return () => {
        // 포커스 해제 시 정리 작업
        if (showCartMessage) {
          setShowCartMessage(false);
        }
        // 포커스 해제 시 바텀시트 닫기
        setShowPaymentSheet(false);
      };
    }, [])
  );

  // 카트 메시지가 표시되면 자동으로 사라지게 하는 효과
  useEffect(() => {
    let timer;

    if (showCartMessage) {
      // 메시지 표시 애니메이션
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // 3초 후 메시지 숨기기
      timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowCartMessage(false));
      }, 3000);
    }

    // 정리 함수에서 타이머와 애니메이션 정리
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      if (showCartMessage) {
        fadeAnim.stopAnimation();
      }
    };
  }, [showCartMessage]);

  // 뒤로가기 핸들러
  const handleBackPress = useCallback(() => {
    // 상태 정리
    if (showCartMessage) {
      setShowCartMessage(false);
    }

    // 약간의 지연 후 네비게이션 수행
    setTimeout(() => {
      navigation.goBack();
    }, 150);

    return true; // 이벤트 처리됨을 표시
  }, [showCartMessage, navigation]);

  // 장바구니 개수 가져오기
  const fetchCartItemCount = async () => {
    try {
      const { data } = await getCartItemCount();
      setCartItemCount(data);
    } catch (error) {
      console.error("장바구니 개수 조회 오류:", error);
      setCartItemCount(0);
    }
  };

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const { data } = await getProductDetail(productId);
      setProduct(data);
      setError(null);
    } catch (error) {
      console.error("상품 상세 정보 로드 에러:", error);
      setError(error.message || "상품 정보를 불러오는데 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 장바구니에 추가 기능
  const handleAddToCart = async () => {
    try {
      await addToCart(productId);
      setShowCartMessage(true);
      fetchCartItemCount();
    } catch (error) {
      console.error("장바구니 추가 오류:", error);
      Alert.alert(
        "오류",
        error.message || "장바구니 추가 중 오류가 발생했습니다."
      );
    }
  };

  // 바로 구매 함수 수정
  const buyNow = () => {
    setShowPaymentSheet(true);
  };

  // 선물하기 기능 수정
  const sendGift = () => {
    setShowGiftSheet(true);
  };

  // 비활성화 상태를 확인하는 변수
  const isOutOfStock = product && product.quantity === 0;

  // 이미지 슬라이더 렌더링
  const renderImageSlider = () => {
    return (
      <View style={styles.imageContainer}>
        <FlatList
          data={product.images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews={false} // 추가: 화면 밖 항목 제거 방지
          maxToRenderPerBatch={3}
          initialNumToRender={1}
          onScrollToIndexFailed={() => {}}
          onMomentumScrollEnd={(event) => {
            const slideIndex = Math.floor(
              event.nativeEvent.contentOffset.x /
                event.nativeEvent.layoutMeasurement.width
            );
            setCurrentImageIndex(slideIndex);
          }}
          renderItem={({ item }) => {
            // 기본 URL에 width와 height 파라미터 추가
            const optimizedImageUrl = `${item}?w=${Math.round(
              width
            )}&h=${Math.round(width)}&t=cover&f=webp`;

            return (
              <Image
                source={{ uri: optimizedImageUrl }}
                style={styles.productImage}
                resizeMode="contain"
                fadeDuration={0}
              />
            );
          }}
          keyExtractor={(item, index) => `image-${index}`}
        />

        {/* 이미지 페이지 인디케이터 */}
        <View style={styles.pageIndicator}>
          <Text style={styles.pageIndicatorText}>
            {currentImageIndex + 1}/{product.images.length}
          </Text>
        </View>

        {/* 이미지 도트 인디케이터 */}
        <View style={styles.dotIndicatorContainer}>
          {product.images.map((_, index) => (
            <View
              key={`dot-${index}`}
              style={[
                styles.dot,
                currentImageIndex === index
                  ? styles.activeDot
                  : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  // 장바구니 성공 메시지 렌더링
  const renderCartMessage = () => {
    if (!showCartMessage) return null;

    return (
      <Animated.View
        style={[styles.cartMessageContainer, { opacity: fadeAnim }]}
      >
        <View style={styles.cartMessageContent}>
          <View style={styles.checkIconContainer}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.cartMessageText}>
            성공적으로 장바구니에 추가되었습니다.
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }).start(() => setShowCartMessage(false));
            }}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.loadingText}>상품 정보를 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchProductDetails}
        >
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>상품 정보를 찾을 수 없습니다.</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          {/* 기존 장바구니 버튼 코드 그대로 유지 */}
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate("Cart")}
          >
            <Image
              source={require("../../assets/cart-icon.png")}
              style={styles.cartIcon}
            />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} removeClippedSubviews={false}>
        {/* 상품 이미지 슬라이더 */}
        {renderImageSlider()}

        {/* 상품 정보 */}
        <View style={styles.productInfo}>
          <Text style={styles.brand}>{product.brand}</Text>
          <View style={styles.divider} />
          <Text style={styles.category}>{product.categoryName}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.priceStockContainer}>
            <Text style={styles.price}>{product.price} WORK</Text>
            {product.quantity > 0 ? (
              <Text style={styles.stockText}>
                남은 재고: {product.quantity}
              </Text>
            ) : (
              <Text style={styles.outOfStockText}>품절</Text>
            )}
          </View>

          {product && product.quantity <= 5 && product.quantity > 0 && (
            <Text style={styles.lowStockText}>
              품절 임박! 재고가 얼마 남지 않았습니다.
            </Text>
          )}

          <View style={styles.divider} />

          {/* 상품 설명 */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>상품 설명</Text>
            <Text style={styles.description}>{product.detail}</Text>
          </View>
        </View>
      </ScrollView>

      {/* 장바구니 성공 메시지 */}
      {renderCartMessage()}

      {/* 하단 버튼 영역 - 3개 버튼으로 변경 */}
      <View style={styles.threeButtonContainer}>
        <TouchableOpacity style={styles.buttonOutline} onPress={handleAddToCart}>
          <Text style={styles.buttonOutlineText}>장바구니</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonOutline, isOutOfStock && { opacity: 0.5 }]}
          onPress={buyNow}
          disabled={isOutOfStock}
        >
          <Text style={styles.buttonOutlineText}>바로 구매</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonFilled, isOutOfStock && { opacity: 0.5 }]}
          onPress={sendGift}
          disabled={isOutOfStock}
        >
          <Text style={styles.buttonFilledText}>선물하기</Text>
        </TouchableOpacity>
      </View>

      {/* 결제 바텀시트 */}
      <PaymentBottomSheet
        visible={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
        deliveryInfo={deliveryInfo}
        product={product}
        navigation={navigation}
      />

      {/* 선물하기 바텀시트 추가 */}
      <GiftBottomSheet
        visible={showGiftSheet}
        onClose={() => setShowGiftSheet(false)}
        product={product}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ff3b30",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#FF8C00",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartButton: {
    padding: 5,
    position: "relative",
  },
  cartIcon: {
    width: 24,
    height: 24,
  },
  cartBadge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "red",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    height: width,
    position: "relative",
  },
  productImage: {
    width: width,
    height: width,
    backgroundColor: "#f8f8f8",
  },
  pageIndicator: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  pageIndicatorText: {
    color: "white",
    fontSize: 12,
  },
  dotIndicatorContainer: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#FF8C00",
  },
  inactiveDot: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  productInfo: {
    padding: 20,
  },
  brand: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 15,
  },
  category: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  price: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  lowStockText: {
    fontSize: 14,
    color: "red",
    marginTop: 8,
    fontWeight: "500",
  },
  descriptionContainer: {
    marginTop: 10,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#666",
  },
  threeButtonContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    padding: 15,
    justifyContent: "space-between",
  },
  buttonOutline: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#FF8C00",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    backgroundColor: "white",
  },
  buttonOutlineText: {
    color: "#FF8C00",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonFilled: {
    flex: 1,
    height: 50,
    backgroundColor: "#FF8C00",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  buttonFilledText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cartMessageContainer: {
    position: "absolute",
    bottom: 80,
    left: 15,
    right: 15,
    alignItems: "center",
    zIndex: 1000,
  },
  cartMessageContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00C851",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 15,
    width: "100%",
  },
  checkIconContainer: {
    marginRight: 10,
  },
  cartMessageText: {
    flex: 1,
    color: "white",
    fontSize: 14,
  },
  closeButton: {
    padding: 5,
  },
  priceStockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stockText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  outOfStockText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
  },
});

export default ProductDetailScreen;
