import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PaymentFailScreen = ({ navigation, route }) => {
  const { orderId, errorMessage, isUserRejected } = route.params || {};

  const handleRetry = () => {
    // 장바구니 화면으로 돌아가기
    navigation.navigate('Cart');
  };

  const handleGoHome = () => {
    // 스토어 메인으로 이동
    navigation.navigate('StoreMain');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleGoHome}
        >
          <Ionicons name="close" size={28} color="#000000" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Image
          source={require('../../assets/payment-failed.png')}
          style={styles.icon}
        />
        <Text style={styles.title}>결제 실패</Text>
        <Text style={styles.message}>
          {isUserRejected 
            ? '결제가 취소되었습니다.'
            : errorMessage || '결제 처리 중 문제가 발생했습니다.'}
        </Text>
        {orderId && (
          <Text style={styles.orderNumber}>주문번호: {orderId}</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.retryButton]}
          onPress={handleRetry}
        >
          <Text style={styles.buttonText}>다시 시도</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.homeButton]}
          onPress={handleGoHome}
        >
          <Text style={[styles.buttonText, styles.homeButtonText]}>
            쇼핑 계속하기
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
    justifyContent: 'flex-end',
    padding: 15,
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FF3B30',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 15,
  },
  orderNumber: {
    fontSize: 14,
    color: '#888888',
  },
  buttonContainer: {
    padding: 20,
    gap: 10,
  },
  button: {
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#FF8C00',
  },
  homeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF8C00',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  homeButtonText: {
    color: '#FF8C00',
  },
});

export default PaymentFailScreen; 