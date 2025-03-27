import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCartMessage, setShowCartMessage] = useState(false);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  // 카트 메시지가 표시되면 자동으로 사라지게 하는 효과
  useEffect(() => {
    if (showCartMessage) {
      // 메시지 표시 애니메이션
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // 3초 후 메시지 숨기기
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowCartMessage(false));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showCartMessage]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://j12d211.p.ssafy.io/api/items/${productId}`);
      const data = await response.json();
      
      // API에서 에러 응답이 왔는지 확인
      if (data.code) {
        throw new Error(data.message || '상품 정보를 불러오지 못했습니다.');
      }
      
      setProduct(data);
      setError(null);
    } catch (error) {
      console.error('상품 상세 정보 로드 에러:', error);
      setError(error.message || '상품 정보를 불러오는데 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 장바구니에 추가 기능
  const addToCart = async () => {
    try {
      // 로딩 상태 추가 가능 (필요시)
      // setLoading(true);
      
      const response = await fetch('https://j12d211.p.ssafy.io/api/shopping-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 필요한 경우 인증 토큰 추가
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itemId: productId, // route.params에서 받은 productId 사용
          quantity: 1 // 요구사항대로 1로 고정
        })
      });
      
      // 응답이 성공적이지 않은 경우
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '장바구니 추가에 실패했습니다.');
      }
      
      // 성공 메시지 표시
      setShowCartMessage(true);
    } catch (error) {
      console.error('장바구니 추가 오류:', error);
      // 에러 메시지 표시
      Alert.alert(
        '오류',
        error.message || '장바구니 추가 중 오류가 발생했습니다.'
      );
    } finally {
      // 로딩 상태 종료 (필요시)
      // setLoading(false);
    }
  };

  // 바로 구매 기능
  const buyNow = () => {
    // 실제로는 구매 페이지로 이동
    Alert.alert('알림', '구매 페이지로 이동합니다.');
  };

  // 선물하기 기능
  const sendGift = () => {
    // 실제로는 선물하기 페이지로 이동
    Alert.alert('알림', '선물하기 페이지로 이동합니다.');
  };

  // 이미지 슬라이더 렌더링
  const renderImageSlider = () => {
    return (
      <View style={styles.imageContainer}>
        <FlatList
          data={product.images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const slideIndex = Math.floor(
              event.nativeEvent.contentOffset.x / 
              event.nativeEvent.layoutMeasurement.width
            );
            setCurrentImageIndex(slideIndex);
          }}
          renderItem={({ item }) => (
            <Image 
              source={{ uri: item }} 
              style={styles.productImage}
              resizeMode="contain"
            />
          )}
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
                currentImageIndex === index ? styles.activeDot : styles.inactiveDot
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
      <Animated.View style={[styles.cartMessageContainer, { opacity: fadeAnim }]}>
        <View style={styles.cartMessageContent}>
          <View style={styles.checkIconContainer}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.cartMessageText}>성공적으로 장바구니에 추가되었습니다.</Text>
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <Image 
              source={require('../../assets/cart-icon.png')}
              style={styles.cartIcon}
            />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 상품 이미지 슬라이더 */}
        {renderImageSlider()}

        {/* 상품 정보 */}
        <View style={styles.productInfo}>
          <Text style={styles.brand}>{product.brand}</Text>
          <View style={styles.divider} />
          <Text style={styles.category}>{product.categoryName}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{product.price} WORK</Text>
          
          {product.quantity <= 5 && (
            <Text style={styles.lowStockText}>품절 임박! ({product.quantity}개 남음)</Text>
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
        <TouchableOpacity 
          style={styles.buttonOutline}
          onPress={addToCart}
        >
          <Text style={styles.buttonOutlineText}>장바구니</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.buttonOutline}
          onPress={buyNow}
        >
          <Text style={styles.buttonOutlineText}>바로 구매</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.buttonFilled}
          onPress={sendGift}
        >
          <Text style={styles.buttonFilledText}>선물하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartButton: {
    padding: 5,
    position: 'relative',
  },
  cartIcon: {
    width: 24,
    height: 24,
  },
  cartBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    height: width,
    position: 'relative',
  },
  productImage: {
    width: width,
    height: width,
    backgroundColor: '#f8f8f8',
  },
  pageIndicator: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  pageIndicatorText: {
    color: 'white',
    fontSize: 12,
  },
  dotIndicatorContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FF8C00',
  },
  inactiveDot: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  productInfo: {
    padding: 20,
  },
  brand: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 15,
  },
  category: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  lowStockText: {
    fontSize: 14,
    color: 'red',
    marginTop: 8,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 10,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  // 3개 버튼을 위한 새 스타일
  threeButtonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 15,
    justifyContent: 'space-between',
  },
  buttonOutline: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#FF8C00',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: 'white',
  },
  buttonOutlineText: {
    color: '#FF8C00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonFilled: {
    flex: 1,
    height: 50,
    backgroundColor: '#FF8C00',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonFilledText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 장바구니 추가 메시지 스타일
  cartMessageContainer: {
    position: 'absolute',
    bottom: 80,
    left: 15,
    right: 15,
    alignItems: 'center',
    zIndex: 1000,
  },
  cartMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00C851', // 초록색 배경
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 15,
    width: '100%',
  },
  checkIconContainer: {
    marginRight: 10,
  },
  cartMessageText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
  },
  closeButton: {
    padding: 5,
  },
});

export default ProductDetailScreen;