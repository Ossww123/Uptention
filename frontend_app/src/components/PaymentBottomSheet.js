// src/components/PaymentBottomSheet.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { post } from '../services/api';
import { API_BASE_URL } from '../config/config';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const { height } = Dimensions.get('window');

const SHOP_WALLET_ADDRESS = '4uDQ7uwEe1iy8R5vYtSvD6vNfcyeTLy8YKyVe44RKR92';

const PaymentBottomSheet = ({ 
  visible, 
  onClose, 
  deliveryInfo,
  product,
  navigation
}) => {
  const [loading, setLoading] = useState(false);
  const { tokenBalance, publicKey, sendSPLToken } = useWallet();
  const { authToken } = useAuth();

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      // 1. 주문 검증 API 요청 데이터 준비
      const orderVerifyData = [{
        itemId: product.itemId,
        price: product.price,
        quantity: 1
      }];
      
      console.log('=== 주문 검증 시작 ===');
      console.log('검증 요청 데이터:', JSON.stringify(orderVerifyData, null, 2));
      
      // 2. 주문 검증 API 호출
      const { data: verifyData, ok, status } = await post("/orders/verify", orderVerifyData);
      
      console.log('검증 응답:', JSON.stringify(verifyData, null, 2));
      console.log('검증 상태:', ok ? '성공' : '실패');
      
      if (ok) {
        console.log('=== 검증 성공: 결제 진행 ===');
        
        // 3. 결제 처리 로직
        const purchaseData = {
          items: [{
            itemId: product.itemId,
            quantity: 1
          }],
          address: `${deliveryInfo.address} ${deliveryInfo.detail}`
        };

        console.log('결제 요청 데이터:', JSON.stringify(purchaseData, null, 2));

        const response = await axios.post(
          `${API_BASE_URL}/api/orders/purchase`,
          purchaseData,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('결제 API 응답:', JSON.stringify(response.data, null, 2));

        const { orderId, paymentAmount } = response.data;

        if (orderId && paymentAmount) {
          console.log('=== 토큰 전송 시작 ===');
          console.log('주문 번호:', orderId);
          console.log('결제 금액:', paymentAmount);
          
          // 4. 토큰 전송
          const memo = `ORDER_${orderId}`;
          await sendSPLToken(
            SHOP_WALLET_ADDRESS,
            paymentAmount.toString(),
            memo
          );

          console.log('=== 토큰 전송 완료 ===');

          onClose();
          navigation.navigate('OrderComplete', {
            orderId: orderId,
            paymentAmount: paymentAmount
          });
        }
      } else {
        // 검증 실패 처리
        let errorMessage = "상품 검증 중 오류가 발생했습니다.";
        
        if (status === 400) {
          errorMessage = verifyData.message || "재고가 부족한 상품이 있습니다.";
        } else if (status === 404) {
          errorMessage = verifyData.message || "존재하지 않는 상품이 있습니다.";
        } else if (status === 409) {
          errorMessage = verifyData.message || "상품 가격이 변경되었습니다.";
        }
        
        console.log('=== 검증 실패 ===');
        console.log('실패 사유:', errorMessage);
        
        Alert.alert("주문 확인", errorMessage, [
          {
            text: "확인",
            onPress: () => {
              onClose();
              navigation.goBack();
            }
          }
        ]);
      }
    } catch (error) {
      console.error('=== 결제 오류 ===');
      console.error('에러 타입:', error.name);
      console.error('에러 메시지:', error.message);
      console.error('에러 응답:', error.response?.data);
      
      Alert.alert(
        "오류",
        "결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
        [
          {
            text: "확인",
            onPress: onClose
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.bottomSheet}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>배송 정보</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* 배송 정보 섹션 */}
            <View style={styles.section}>
              <View style={styles.addressContainer}>
                <View style={styles.iconContainer}>
                  <Ionicons name="location-outline" size={24} color="#666" />
                </View>
                <View style={styles.addressTextContainer}>
                  <Text style={styles.addressLabel}>배송 주소</Text>
                  <Text style={styles.addressText}>{deliveryInfo.address}</Text>
                  <Text style={styles.addressDetail}>{deliveryInfo.detail}</Text>
                </View>
                <TouchableOpacity style={styles.editButton}>
                  <Ionicons name="chevron-forward" size={24} color="#888" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 주문 상품 섹션 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>주문 상품</Text>
              <View style={styles.productItem}>
                <Text style={styles.productBrand}>{product.brand}</Text>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productQuantity}>1개</Text>
                <Text style={styles.productPrice}>{product.price} WORK</Text>
              </View>
            </View>

            {/* 결제 금액 섹션 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>결제 금액</Text>
              <View style={styles.paymentInfoContainer}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>보유 WORK</Text>
                  <Text style={styles.paymentValue}>7899.9 WORK</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>상품 WORK</Text>
                  <Text style={styles.paymentValue}>{product.price} WORK</Text>
                </View>
                <View style={[styles.paymentRow, styles.finalPaymentRow]}>
                  <Text style={styles.paymentLabel}>결제 후 WORK</Text>
                  <Text style={styles.paymentValue}>
                    {(7899.9 - product.price).toFixed(1)} WORK
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* 결제 버튼 */}
          <View style={styles.paymentButtonContainer}>
            <TouchableOpacity 
              style={styles.paymentButton}
              onPress={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.paymentButtonText}>결제하기</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  productBrand: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentInfoContainer: {
    backgroundColor: '#f8f8f8',
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
    borderTopColor: '#e5e5e5',
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
    borderTopColor: '#f0f0f0',
  },
  paymentButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PaymentBottomSheet;