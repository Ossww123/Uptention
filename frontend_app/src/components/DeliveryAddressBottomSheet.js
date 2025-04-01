import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/config';
import { useAuth } from '../contexts/AuthContext';

const { height } = Dimensions.get('window');

const DeliveryAddressBottomSheet = ({ visible, onClose, orderId }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const { authToken } = useAuth();

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
      // 바텀시트가 닫힐 때 입력값 초기화
      setAddress('');
      setDetailAddress('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    try {
      const fullAddress = `${address} ${detailAddress}`.trim();
      
      if (!fullAddress) {
        Alert.alert('알림', '주소를 입력해주세요.');
        return;
      }

      // 배송 정보 등록 API 호출
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

      Alert.alert('알림', '배송지가 등록되었습니다.', [
        {
          text: '확인',
          onPress: onClose
        }
      ]);
    } catch (error) {
      console.error('배송지 등록 오류:', error);
      Alert.alert('오류', '배송지 등록에 실패했습니다. 다시 시도해주세요.');
    }
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
              <View style={styles.handle} />
              <Text style={styles.title}>배송지 입력</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>주소</Text>
                <TextInput
                  style={styles.input}
                  placeholder="주소를 입력해주세요"
                  value={address}
                  onChangeText={setAddress}
                />
                <TextInput
                  style={styles.input}
                  placeholder="상세주소를 입력해주세요"
                  value={detailAddress}
                  onChangeText={setDetailAddress}
                />
              </View>

              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  (!address || !detailAddress) && styles.submitButtonDisabled
                ]} 
                onPress={handleSubmit}
                disabled={!address || !detailAddress}
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
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
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