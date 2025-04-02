import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DeliveryAddressBottomSheet from '../components/DeliveryAddressBottomSheet';
import axios from 'axios';
import { API_BASE_URL } from '../config/config';
import { useAuth } from '../contexts/AuthContext';

const GiftDetailScreen = ({ route, navigation }) => {
  const { item } = route.params;
  const [giftData, setGiftData] = useState(item);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const { authToken } = useAuth();


  // 디버깅을 위한 콘솔 출력 추가
  console.log('선물 상세 정보:', {
    ...item,
    statusType: typeof item.status,
    statusEquals: item.status === '수령 대기',
    statusLength: item.status?.length
  });

  const handleReceiveGift = () => {
    setIsBottomSheetVisible(true);
  };

  const handleDeliverySuccess = () => {
    // 선물함 화면으로 이동 (새로 렌더링)
    navigation.replace('GiftBox');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* 상품 이미지 */}
        {giftData.imageUrl ? (
          <Image
            source={{ uri: giftData.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.defaultImageContainer]}>
            <Text style={styles.defaultImageText}>선물 이미지</Text>
          </View>
        )}

        {/* 상품 정보 */}
        <View style={styles.infoContainer}>
          <Text style={styles.brand}>{giftData.brand}</Text>
          <Text style={styles.itemName}>{giftData.itemName}</Text>
          
          <View style={styles.senderInfo}>
            <Text style={styles.senderLabel}>보낸 사람</Text>
            <Text style={styles.senderName}>{giftData.senderName}</Text>
          </View>

          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>수령 예정일</Text>
            <Text style={styles.date}>
              {new Date(giftData.receivedDate).toLocaleDateString('ko-KR')}
            </Text>
          </View>

          {/* 선물 상태 표시 추가 */}
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>선물 상태</Text>
            <Text style={[
              styles.statusText,
              giftData.status === '수령 대기' ? styles.statusPending : styles.statusReceived
            ]}>
              {giftData.status}
            </Text>
          </View>

          {/* 배송 주소 - 수령 완료 상태일 때만 표시 */}
          {giftData.status === '수령 완료' && giftData.address && (
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>배송 주소</Text>
              <Text style={styles.addressText}>{giftData.address}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 수령하기 버튼 - 수령 대기 상태일 때만 표시 */}
      {giftData.status === '수령 대기' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.receiveButton}
            onPress={handleReceiveGift}
          >
            <Text style={styles.buttonText}>수령하기</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 배송지 입력 바텀시트 */}
      <DeliveryAddressBottomSheet
        visible={isBottomSheetVisible}
        onClose={() => setIsBottomSheetVisible(false)}
        orderId={giftData.orderId}
        onSuccess={handleDeliverySuccess}
      />
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  image: {
    width: width,
    height: width,
    backgroundColor: '#F0F0F0',
  },
  defaultImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultImageText: {
    fontSize: 16,
    color: '#999999',
  },
  infoContainer: {
    padding: 20,
  },
  brand: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    color: '#333333',
  },
  senderInfo: {
    marginBottom: 16,
  },
  senderLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  dateInfo: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  receiveButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusInfo: {
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusPending: {
    color: '#FF8C00',
  },
  statusReceived: {
    color: '#4CAF50',
  },
  addressInfo: {
    marginBottom: 16,
  },
  addressLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
});

export default GiftDetailScreen; 