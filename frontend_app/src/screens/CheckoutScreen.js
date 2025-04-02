import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config/config';

const CheckoutScreen = ({ navigation, route }) => {
  // CartScreen에서 전달받은 선택된 상품 정보와 총 가격
  const { selectedItems = [], totalPrice = 0 } = route.params || {};
  
  const { tokenBalance, publicKey } = useWallet();
  const { authToken } = useAuth();

  // 더미 데이터 - 배송 정보
  const shippingAddress = {
    address: '경상북도 진평시 진평길 55-5',
    detail: '최강아파트 211호',
  };

  // 주문 상품 (CartScreen에서 전달받은 데이터가 있으면 사용, 없으면 더미 데이터 사용)
  const orderItems = selectedItems.length > 0
    ? selectedItems.map(item => ({
        id: item.cartId || item.itemId,
        brand: item.brand,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.thumbnail 
          ? { uri: item.thumbnail } 
          : require('../../assets/product-placeholder.png'),
      }))
    : [
        {
          id: '1',
          brand: '브랜드',
          name: '상품 이름',
          price: 2.9,
          quantity: 1,
          image: require('../../assets/product-placeholder.png'),
        },
        {
          id: '2',
          brand: '브랜드',
          name: '상품 이름',
          price: 2.9,
          quantity: 1,
          image: require('../../assets/product-placeholder.png'),
        },
      ];

  const [paymentInfo, setPaymentInfo] = useState({
    availableWorkCoins: 0,
    productTotal: 0,
    finalAmount: 0
  });

  useEffect(() => {
    const calculatePaymentInfo = () => {
      const productTotal = totalPrice > 0 ? totalPrice : 5.8;
      const availableWorkCoins = publicKey ? tokenBalance : 0;
      const finalAmount = availableWorkCoins - productTotal;

      setPaymentInfo({
        availableWorkCoins,
        productTotal,
        finalAmount
      });
    };

    calculatePaymentInfo();
  }, [totalPrice, tokenBalance, publicKey]);

  // 뒤로 가기
  const handleGoBack = () => {
    navigation.goBack();
  };

  // 결제하기
  const handlePayment = async () => {
    try {
      // 주문 상품 데이터 준비
      const orderItems = selectedItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity
      }));

      // API 요청 데이터 준비
      const requestData = {
        items: orderItems,
        address: `${shippingAddress.address} ${shippingAddress.detail}`
      };

      console.log('주문 요청 데이터:', requestData);

      // API 호출
      const response = await axios.post(
        `${API_BASE_URL}/api/orders/purchase`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('API 응답:', response.data);

      // API 응답이 성공 메시지인 경우
      if (response.data === '주문 처리 성공') {
        // 주문 완료 화면으로 이동
        navigation.navigate('OrderComplete', {
          orderId: '주문 완료', // 임시로 표시
          paymentAmount: paymentInfo.productTotal // 상품 총액을 결제 금액으로 사용
        });
      } else if (response.data && response.data.orderId) {
        // API가 orderId와 paymentAmount를 반환하는 경우
        navigation.navigate('OrderComplete', {
          orderId: response.data.orderId,
          paymentAmount: response.data.paymentAmount
        });
      } else {
        throw new Error('주문 정보가 올바르지 않습니다.');
      }

    } catch (error) {
      console.error('주문 생성 실패:', error.response?.data || error.message);
      
      // 에러 메시지 처리
      let errorMessage = '주문 처리 중 오류가 발생했습니다.';
      if (error.response?.data) {
        switch (error.response.data.code) {
          case 'ITEM_004':
            errorMessage = '재고가 부족한 상품이 있습니다.';
            break;
          case 'ITEM_001':
            errorMessage = '상품이 존재하지 않습니다.';
            break;
          case 'X002':
            errorMessage = '주문 정보가 올바르지 않습니다.';
            break;
          default:
            errorMessage = error.response.data.message || errorMessage;
        }
      }

      Alert.alert('주문 실패', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>주문서</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* 배송 정보 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>배송 정보</Text>
          
          <View style={styles.addressContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={24} color="#666" />
            </View>
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressLabel}>배송 주소</Text>
              <Text style={styles.addressText}>{shippingAddress.address}</Text>
              <Text style={styles.addressDetail}>{shippingAddress.detail}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="chevron-forward" size={24} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 주문 상품 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주문 상품</Text>
          
          {orderItems.map((item, index) => (
            <View 
              key={item.id} 
              style={[
                styles.productItem, 
                index < orderItems.length - 1 && styles.productItemWithBorder
              ]}
            >
              <Image source={item.image} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productBrand}>{item.brand}</Text>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productQuantity}>{item.quantity}개</Text>
                <Text style={styles.productPrice}>{item.price} WORK</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 결제 금액 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>결제 금액</Text>
          
          <View style={styles.paymentInfoContainer}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>보유 WORK</Text>
              <Text style={styles.paymentValue}>
                {publicKey ? `${paymentInfo.availableWorkCoins.toFixed(1)}` : '지갑 연결 필요'} WORK
              </Text>
            </View>
            
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>상품 WORK</Text>
              <Text style={styles.paymentValue}>{paymentInfo.productTotal.toFixed(1)} WORK</Text>
            </View>
            
            <View style={[styles.paymentRow, styles.finalPaymentRow]}>
              <Text style={styles.paymentLabel}>결제 후 WORK</Text>
              <Text style={[
                styles.paymentValue,
                (!publicKey || paymentInfo.finalAmount < 0) && styles.insufficientBalance
              ]}>
                {publicKey ? `${paymentInfo.finalAmount.toFixed(1)}` : '-'} WORK
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 결제 버튼 */}
      <View style={styles.paymentButtonContainer}>
        <TouchableOpacity 
          style={[
            styles.paymentButton,
            (!publicKey || paymentInfo.finalAmount < 0) && styles.disabledButton
          ]}
          onPress={handlePayment}
          disabled={!publicKey || paymentInfo.finalAmount < 0}
        >
          <Text style={styles.paymentButtonText}>
            {!publicKey ? '지갑 연결 필요' : paymentInfo.finalAmount < 0 ? 'WORK 부족' : '결제하기'}
          </Text>
        </TouchableOpacity>
      </View>
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
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 30,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 10,
    marginTop: 2,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 3,
  },
  addressDetail: {
    fontSize: 16,
    fontWeight: '500',
  },
  editButton: {
    padding: 5,
  },
  productItem: {
    flexDirection: 'row',
    paddingVertical: 15,
  },
  productItemWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productBrand: {
    fontSize: 14,
    color: '#888',
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentInfoContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 15,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  finalPaymentRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    marginTop: 10,
    paddingTop: 15,
  },
  paymentLabel: {
    fontSize: 16,
    color: '#333',
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentButtonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  paymentButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  insufficientBalance: {
    color: '#FF3B30',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
});

export default CheckoutScreen;