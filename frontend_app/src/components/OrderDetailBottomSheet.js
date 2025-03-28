import React, { useEffect, useRef } from 'react';
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
} from 'react-native';

const { height } = Dimensions.get('window');

const OrderDetailBottomSheet = ({ visible, onClose, order }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
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
  }, [visible]);

  if (!order) return null;

  const renderContent = () => {
    if (order.type === 'gift') {
      // 선물 목록일 경우
      return (
        <>
          <View style={styles.detailRow}>
            <Text style={styles.label}>주문 상태</Text>
            <Text style={styles.value}>{order.status}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>브랜드</Text>
            <Text style={styles.value}>두레주로</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>상품명</Text>
            <Text style={styles.value}>{order.title}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>결제 금액</Text>
            <Text style={[styles.value, styles.amount]}>{order.amount}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>주문 일시</Text>
            <Text style={styles.value}>{order.date}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.recipientInfo}>
            <Text style={styles.recipientTitle}>받는 사람 정보</Text>
            <View style={styles.detailRow}>
              <Text style={styles.label}>이름</Text>
              <Text style={styles.value}>홍길동</Text>
            </View>
          </View>
        </>
      );
    } else {
      // 구매 목록일 경우
      return (
        <>
          <View style={styles.detailRow}>
            <Text style={styles.label}>주문 상태</Text>
            <Text style={styles.value}>{order.status}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>브랜드</Text>
            <Text style={styles.value}>두레주로</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>상품명</Text>
            <Text style={styles.value}>{order.title}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>수량</Text>
            <Text style={styles.value}>1개</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>결제 금액</Text>
            <Text style={[styles.value, styles.amount]}>{order.amount}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>주문 일시</Text>
            <Text style={styles.value}>{order.date}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryTitle}>배송 정보</Text>
            <View style={styles.deliveryAddress}>
              <Text style={styles.addressLabel}>배송지</Text>
              <Text style={styles.addressValue}>
                대전광역시 유성구 동서대로 125{'\n'}
                한국과학기술원 E11
              </Text>
            </View>
          </View>
        </>
      );
    }
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
  },
  value: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
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
  deliveryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  deliveryAddress: {
    marginTop: 4,
  },
  addressLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  addressValue: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  recipientInfo: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
  },
  recipientTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
});

export default OrderDetailBottomSheet; 