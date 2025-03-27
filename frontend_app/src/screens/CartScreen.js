import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CartScreen = ({ navigation }) => {
  // 장바구니 상품 상태 관리
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 컴포넌트 마운트 시 더미 데이터 로드
  useEffect(() => {
    // 더미 데이터 로드를 시뮬레이션하는 타이머
    const timer = setTimeout(() => {
      // 더미 데이터 - 실제 구현 시 API 호출로 대체
      const dummyCartItems = [
        {
          id: '1',
          brand: '브랜드명',
          name: '물건이름',
          price: 1.0,
          unit: 'WORK',
          quantity: 2,
          image: require('../../assets/product1.png'),
          selected: true
        },
        {
          id: '2',
          brand: '브랜드명',
          name: '물건이름',
          price: 2.5,
          unit: 'WORK',
          quantity: 1,
          image: require('../../assets/product2.png'),
          selected: true
        }
      ];
      
      setCartItems(dummyCartItems);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // 수량 변경 함수
  const updateQuantity = (id, increment) => {
    setCartItems(prevItems => 
      prevItems.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + increment);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  // 상품 선택 토글 함수
  const toggleSelection = (id) => {
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // 선택 삭제 함수
  const deleteSelected = () => {
    setCartItems(prevItems => prevItems.filter(item => !item.selected));
  };

  // 상품 개별 삭제 함수
  const deleteItem = (id) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  // 전체 선택/해제 함수
  const toggleSelectAll = () => {
    const allSelected = cartItems.every(item => item.selected);
    setCartItems(prevItems => 
      prevItems.map(item => ({ ...item, selected: !allSelected }))
    );
  };

  // 장바구니 상품 목록 렌더링
  const renderCartItems = () => {
    return cartItems.map(item => (
      <View key={item.id} style={styles.cartItem}>
        <TouchableOpacity 
          style={styles.selectButton}
          onPress={() => toggleSelection(item.id)}
        >
          <View style={[
            styles.checkbox, 
            item.selected ? styles.checkboxSelected : styles.checkboxUnselected
          ]}>
            {item.selected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
          </View>
        </TouchableOpacity>
        
        <View style={styles.deleteButtonContainer}>
          <TouchableOpacity onPress={() => deleteItem(item.id)}>
            <Text style={styles.deleteText}>삭제</Text>
          </TouchableOpacity>
        </View>
        
        <Image source={item.image} style={styles.productImage} />
        
        <View style={styles.productInfo}>
          <Text style={styles.brandText}>{item.brand}</Text>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.priceText}>
            {item.price.toFixed(1)} {item.unit}
          </Text>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, -1)}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            
            <View style={styles.quantityTextContainer}>
              <Text style={styles.quantityText}>{item.quantity}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, 1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.totalPriceContainer}>
          <Text style={styles.totalPriceText}>
            총 {(item.price * item.quantity).toFixed(1)} {item.unit}
          </Text>
        </View>
      </View>
    ));
  };

  // 장바구니 비었을 때 렌더링
  const renderEmptyCart = () => {
    return (
      <View style={styles.emptyCartContainer}>
        <Image 
          source={require('../../assets/cart-icon.png')} 
          style={styles.emptyCartIcon}
        />
        <Text style={styles.emptyCartTitle}>장바구니가 비어있어요.</Text>
        <Text style={styles.emptyCartSubtitle}>장바구니를 새로운 상품으로 채워 보세요.</Text>
        
        <TouchableOpacity 
          style={styles.browseButton}
          onPress={() => navigation.navigate('StoreMain')}
        >
          <Text style={styles.browseButtonText}>상품 보러 가기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 계산 섹션 렌더링
  const renderSummary = () => {
    const selectedItems = cartItems.filter(item => item.selected);
    const itemCount = selectedItems.length;
    const totalPrice = selectedItems.reduce(
      (total, item) => total + item.price * item.quantity, 
      0
    );
    
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>주문 상품 수</Text>
          <Text style={styles.summaryValue}>총 {itemCount}개</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>총 결제금액</Text>
          <Text style={styles.summaryPrice}>{totalPrice.toFixed(1)} WORK</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.checkoutButton}
          onPress={() => navigation.navigate('Checkout')}
          disabled={selectedItems.length === 0}
        >
          <Text style={styles.checkoutButtonText}>
            결제 {totalPrice.toFixed(1)} WORK
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 전체 선택 헤더 렌더링
  const renderSelectionHeader = () => {
    const allSelected = cartItems.length > 0 && cartItems.every(item => item.selected);
    
    return (
      <View style={styles.selectionHeader}>
        <TouchableOpacity 
          style={styles.selectAllContainer}
          onPress={toggleSelectAll}
        >
          <View style={[
            styles.checkbox, 
            allSelected ? styles.checkboxSelected : styles.checkboxUnselected
          ]}>
            {allSelected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
          </View>
          <Text style={styles.selectAllText}>
            전체 선택 ({cartItems.filter(item => item.selected).length}/{cartItems.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={deleteSelected}>
          <Text style={styles.selectionHeaderAction}>선택 삭제</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>장바구니</Text>
        <View style={styles.placeholderView} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      ) : cartItems.length === 0 ? (
        renderEmptyCart()
      ) : (
        <View style={styles.contentContainer}>
          <ScrollView style={styles.scrollContainer}>
            <Text style={styles.sectionTitle}>주문 상세</Text>
            {renderSelectionHeader()}
            {renderCartItems()}
          </ScrollView>
          {renderSummary()}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholderView: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#888888',
  },
  contentContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: '#FF8C00',
  },
  checkboxUnselected: {
    backgroundColor: '#EEEEEE',
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectionHeaderAction: {
    fontSize: 14,
    color: '#888888',
  },
  cartItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    position: 'relative',
  },
  selectButton: {
    marginRight: 10,
    alignSelf: 'center',
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  deleteText: {
    fontSize: 14,
    color: '#888888',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  brandText: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityTextContainer: {
    minWidth: 40,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalPriceContainer: {
    position: 'absolute',
    right: 15,
    bottom: 15,
  },
  totalPriceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryContainer: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
    backgroundColor: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#555555',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 15,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartIcon: {
    width: 100,
    height: 100,
    marginBottom: 20,
    tintColor: '#CCCCCC',
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 30,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CartScreen;