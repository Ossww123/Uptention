import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  // 실제로는 route.params에서 productId를 받아와서 해당 상품 정보를 가져옵니다.
  // const { productId } = route.params;
  
  // 현재는 더미 데이터를 사용
  const product = {
    id: '1',
    name: '물건 이름',
    brand: '브랜드명',
    category: '카테고리',
    price: '0.0 WORK',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    images: [
      require('../../assets/product1.png'),
      require('../../assets/product2.png'),
      require('../../assets/product3.png'),
    ],
  };

  // 현재 보고 있는 이미지 인덱스
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 장바구니에 추가 기능
  const addToCart = () => {
    // 실제로는 장바구니 기능 구현
    alert('장바구니에 추가되었습니다.');
  };

  // 바로 구매 기능
  const buyNow = () => {
    // 실제로는 구매 페이지로 이동
    alert('구매 페이지로 이동합니다.');
  };

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
            onPress={() => navigation.navigate("Cart")}
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
        <View style={styles.imageContainer}>
          <Image 
            source={product.images[currentImageIndex]} 
            style={styles.productImage}
            resizeMode="contain"
          />
          
          {/* 이미지 페이지 인디케이터 */}
          <View style={styles.pageIndicator}>
            <Text style={styles.pageIndicatorText}>
              {currentImageIndex + 1}/{product.images.length}
            </Text>
          </View>
        </View>

        {/* 상품 정보 */}
        <View style={styles.productInfo}>
          <Text style={styles.brand}>{product.brand}</Text>
          <View style={styles.divider} />
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{product.price}</Text>
          
          <View style={styles.divider} />
          
          {/* 상품 설명 */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>상품 설명</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        </View>
      </ScrollView>

      {/* 하단 버튼 영역 */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity 
          style={styles.cartAddButton}
          onPress={addToCart}
        >
          <Text style={styles.cartAddButtonText}>장바구니에 추가</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.buyButton}
          onPress={buyNow}
        >
          <Text style={styles.buyButtonText}>바로 구매</Text>
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
    width: '100%',
    height: '100%',
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
  bottomButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 15,
  },
  cartAddButton: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#FF8C00',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cartAddButtonText: {
    color: '#FF8C00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#FF8C00',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductDetailScreen;