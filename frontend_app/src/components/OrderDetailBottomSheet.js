import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/config';

const { height } = Dimensions.get('window');

const OrderDetailBottomSheet = ({ visible, onClose, orderId, orderItemId, type }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/api/orders/${orderId}/order-items/${orderItemId}`);
      setOrderDetail(response.data);
    } catch (err) {
      setError('주문 상세 정보를 불러오는데 실패했습니다.');
      console.error('Error fetching order detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && orderId && orderItemId) {
      fetchOrderDetail();
      // 바텀 시트를 올리는 애니메이션
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      // 바텀 시트를 내리는 애니메이션
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, orderId, orderItemId]);

  if (!orderId || !orderItemId) return null;

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (!orderDetail) return null;

    return (
      <>
        <View style={styles.detailRow}>
          <Text style={styles.label}>주문 상태</Text>
          <Text style={styles.value}>{orderDetail.status}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>브랜드</Text>
          <Text style={styles.value}>{orderDetail.brand}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>상품명</Text>
          <Text 
            style={[styles.value, styles.itemName]} 
            numberOfLines={1} 
            ellipsizeMode="tail"
          >
            {orderDetail.itemName}
          </Text>
        </View>

        {type === 'PURCHASE' && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>수량</Text>
            <Text style={styles.value}>{orderDetail.quantity}개</Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>결제 금액</Text>
          <Text style={[styles.value, styles.amount]}>-{orderDetail.totalPrice.toLocaleString()} WORK</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>주문 일시</Text>
          <Text style={styles.value}>
            {new Date(orderDetail.orderDate).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).split(' ').join('')}
          </Text>
        </View>

        <View style={styles.divider} />

        {type === 'PURCHASE' && orderDetail.address && (
          <View style={styles.deliveryInfo}>
            <Text style={styles.orderTitle}>배송 주소</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {orderDetail.address}
            </Text>
          </View>
        )}
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.bottomSheet,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.handle} />
              
              <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                  <Text style={styles.title}>주문 상세</Text>
                  {renderContent()}
                </View>
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
    padding: 20,
    maxHeight: height * 0.8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  scrollView: {
    maxHeight: height * 0.75,
  },
  content: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    minWidth: 70,
  },
  value: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    textAlign: 'right',
  },
  itemName: {
    flex: 1,
    marginLeft: 16,
    textAlign: 'right',
  },
  amount: {
    color: '#FF8C00',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 20,
  },
  deliveryInfo: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF0000',
    textAlign: 'center',
  },
  addressText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
});

export default OrderDetailBottomSheet; 