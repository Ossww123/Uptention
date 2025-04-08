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
import { useAuth } from '../contexts/AuthContext';

const { height } = Dimensions.get('window');

const OrderDetailBottomSheet = ({ visible, onClose, orderId, orderItemId, type }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const { authToken } = useAuth();

  // 데이터 로딩 상태 추적을 위한 ref
  const loadingRef = useRef({
    isLoading: false,
    requestId: 0
  });

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setIsLayoutReady(false); // 데이터 로딩 시작 시 레이아웃 준비 상태 초기화
      setError(null);
      
      const currentRequestId = loadingRef.current.requestId + 1;
      loadingRef.current = {
        isLoading: true,
        requestId: currentRequestId
      };
      
      console.log('[OrderDetail] 데이터 로딩 시작:', {
        requestId: currentRequestId,
        orderId,
        orderItemId
      });

      const response = await axios.get(
        `${API_BASE_URL}/api/orders/${orderId}/order-items/${orderItemId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );

      if (loadingRef.current.requestId === currentRequestId) {
        const enrichedData = {
          ...response.data,
          orderId,
          orderItemId
        };
        
        setOrderDetail(enrichedData);
        
        // 데이터 설정 후 즉시 로딩 상태 해제
        setLoading(false);
        loadingRef.current.isLoading = false;
        
        // 데이터 설정 후 레이아웃 준비 상태 업데이트
        requestAnimationFrame(() => {
          setIsLayoutReady(true);
        });
      }
    } catch (err) {
      console.error('[OrderDetail] 데이터 로딩 실패:', err);
      setError('주문 상세 정보를 불러오는데 실패했습니다.');
      setLoading(false);
      loadingRef.current.isLoading = false;
    }
  };

  const renderContent = () => {
    // 로딩 상태 체크 로직 수정
    if (loading || (!isLayoutReady && !error)) {
      console.log('[OrderDetail] 로딩 상태 렌더링:', {
        loading,
        isLayoutReady,
        hasError: !!error,
        hasData: !!orderDetail
      });
      return (
        <View style={[styles.centerContainer, { minHeight: 200 }]}>
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

    if (!orderDetail) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>데이터를 불러올 수 없습니다.</Text>
        </View>
      );
    }

    // 실제 컨텐츠 렌더링
    return (
      <View style={[
        styles.contentContainer,
        type === 'PURCHASE' && { minHeight: 'auto', paddingBottom: 0 }
      ]}>
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

        {type === 'PURCHASE' && (
          <>
            <View style={styles.divider} />
            {orderDetail.address && (
              <View style={styles.deliveryInfo}>
                <Text style={styles.orderTitle}>배송 주소</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                  {orderDetail.address}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  // visible 상태 변경 시 초기화 로직 수정
  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(() => {
        setOrderDetail(null);
        setLoading(false);
        setError(null);
        setIsLayoutReady(false);
        loadingRef.current = {
          isLoading: false,
          requestId: 0
        };
        console.log('[OrderDetail] 상태 초기화 완료');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // 데이터 로딩 트리거 로직 수정
  useEffect(() => {
    if (visible && orderId && orderItemId) {
      fetchOrderDetail();
      
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, orderId, orderItemId]);

  if (!orderId || !orderItemId) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
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
              onLayout={() => {
                console.log('[OrderDetail] 바텀시트 레이아웃 계산 완료');
              }}
            >
              <View style={styles.handle} />
              <ScrollView 
                style={styles.scrollView} 
                showsVerticalScrollIndicator={false}
                onLayout={() => {
                  console.log('[OrderDetail] 스크롤뷰 레이아웃 계산 완료');
                }}
              >
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
    paddingBottom: 0,
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
    minWidth: 100,
  },
  itemName: {
    flex: 1,
    marginLeft: 16,
    textAlign: 'right',
    minWidth: 150,
  },
  amount: {
    color: '#FF8C00',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginTop: 16,
    marginBottom: 16,
  },
  deliveryInfo: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 0,
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
  contentContainer: {
    minHeight: 'auto',
    paddingBottom: 0,
  },
});

export default OrderDetailBottomSheet; 