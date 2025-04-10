import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Alert,
  PanResponder
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/config';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { height } = Dimensions.get('window');

const DeliveryAddressBottomSheet = ({ visible, onClose, orderId, onSuccess, item }) => {
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [address, setAddress] = useState(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const { authToken } = useAuth();

  // 최근 주소를 저장할 ref 추가
  const cachedAddress = useRef(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) { // 아래로 드래그할 때만
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) { // 100px 이상 드래그하면 닫기
          onClose();
        } else {
          // 원위치로 돌아가기
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
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
      setAddress(null);
    }
  }, [visible]);

  // 최근 배송지 조회
  const fetchRecentAddress = async () => {
    try {
      // 이미 캐시된 주소가 있으면 캐시된 주소 사용
      if (cachedAddress.current) {
        setAddress(cachedAddress.current);
        setIsLoadingAddress(false);
        return;
      }

      setIsLoadingAddress(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/orders/delivery-info`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && 
          response.data.address && 
          typeof response.data.address === 'string' && 
          response.data.address.trim() !== '') {
        const addressParts = response.data.address.split(' ');
        const zonecode = addressParts[0].replace('[', '').replace(']', '');
        const roadAddress = addressParts.slice(1, -1).join(' ');
        const detailAddress = addressParts[addressParts.length - 1];

        const newAddress = {
          zonecode,
          roadAddress,
          detailAddress,
          buildingName: ''
        };

        // 주소를 캐시에 저장
        cachedAddress.current = newAddress;
        setAddress(newAddress);
      } else {
        setAddress(null);
      }
    } catch (error) {
      console.error('최근 배송지 조회 실패:', error);
      setAddress(null);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // 컴포넌트 마운트 시 최근 배송지 조회
  useEffect(() => {
    if (navigation) {
      const currentState = navigation.getState();
      if (!currentState.routes.some(route => 
        route.name === 'AddressSearch' || route.name === 'AddressDetail'
      )) {
        fetchRecentAddress();
      }
    }
  }, []);

  // 바텀시트가 보일 때 주소 업데이트
  useEffect(() => {
    if (visible) {
      // 캐시된 주소가 있으면 바로 표시
      if (cachedAddress.current) {
        setAddress(cachedAddress.current);
        setIsLoadingAddress(false);
      } else {
        // 캐시된 주소가 없으면 새로 조회
        fetchRecentAddress();
      }
    }
  }, [visible]);

  // 라우트 파라미터에서 주소 정보 받아오기
  useEffect(() => {
    if (visible && navigation) {
      const currentState = navigation.getState();
      const currentRoute = currentState.routes[currentState.routes.length - 1];
      
      // item에서 address 정보가 있는 경우
      if (item?.address) {
        const addressParts = item.address.split(' ');
        const roadAddress = addressParts.slice(0, -1).join(' ');
        const detailAddress = addressParts[addressParts.length - 1];

        const newAddress = {
          zonecode: '',  // 우편번호는 표시하지 않음
          roadAddress,
          detailAddress,
          buildingName: ''
        };

        // 새 주소를 캐시에 저장
        cachedAddress.current = newAddress;
        setAddress(newAddress);
        setIsLoadingAddress(false);
      }
      // route.params에서 address 정보가 있는 경우
      else if (currentRoute.params?.address) {
        // 새 주소를 캐시에 저장
        cachedAddress.current = currentRoute.params.address;
        setAddress(currentRoute.params.address);
        setIsLoadingAddress(false);
      } else {
        setIsLoadingAddress(false);
      }
    }
  }, [visible, navigation.getState(), item]);

  const handleSubmit = async () => {
    try {
      if (!address) {
        Alert.alert('알림', '주소를 입력해주세요.');
        return;
      }

      const fullAddress = `${address.roadAddress} ${address.detailAddress}`;

      await axios.post(
        `${API_BASE_URL}/api/orders/${orderId}/delivery-info`,
        { address: fullAddress },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          }
        }
      );

      onClose(); // 먼저 바텀시트를 닫고
      
      setTimeout(() => {
        Alert.alert('알림', '배송지가 등록되었습니다.', [
          {
            text: '확인',
            onPress: () => {
              onSuccess && onSuccess();
            }
          }
        ]);
      }, 100);
    } catch (error) {
      console.error('배송지 등록 오류:', error);
      Alert.alert('오류', '배송지 등록에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 주소 검색 화면으로 이동
  const handleAddressSearch = () => {
    onClose(); // 바텀시트를 먼저 닫고
    navigation.navigate('AddressSearch', {
      prevScreen: 'DeliveryAddressBottomSheet',
      orderId: orderId,
      item: item
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
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
              <View {...panResponder.panHandlers} style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>
              <Text style={styles.title}>배송지 입력</Text>
              
              <View style={styles.addressContainer}>
                <View style={styles.iconContainer}>
                  <Ionicons name="location-outline" size={24} color="#666" />
                </View>
                <View style={styles.addressTextContainer}>
                  <Text style={styles.addressLabel}>배송 주소</Text>
                  {isLoadingAddress ? (
                    <Text style={styles.addressText}>배송지 정보를 불러오는 중...</Text>
                  ) : address ? (
                    <>
                      <Text style={styles.addressText}>
                        {address.roadAddress} {address.detailAddress}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.addressText}>배송지를 입력해주세요</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleAddressSearch}
                >
                  <Ionicons name="chevron-forward" size={24} color="#888" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, !address && styles.submitButtonDisabled]} 
                onPress={handleSubmit}
                disabled={!address}
              >
                <Text style={styles.submitButtonText}>확인</Text>
              </TouchableOpacity>
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
  handleContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
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
  submitButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  }
});

export default DeliveryAddressBottomSheet; 