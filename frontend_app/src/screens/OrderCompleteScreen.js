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

const OrderCompleteScreen = ({ navigation, route }) => {
  const { orderId, paymentAmount } = route.params;

  const handleGoToHome = () => {
    // Main 스크린으로 이동 (BottomTabNavigator의 초기 화면)
    navigation.navigate('Main');
  };

  const handleGoToOrderHistory = () => {
    // Main 스크린으로 이동하고 Profile 탭을 통해 OrderHistory로 이동
    navigation.navigate('Main', {
      state: {
        routes: [
          { name: 'Profile' },
          { name: 'OrderHistory' }
        ],
        index: 1,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 완료 아이콘 */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#FF8C00" />
        </View>

        {/* 주문 완료 메시지 */}
        <Text style={styles.title}>주문이 완료되었습니다</Text>
        <Text style={styles.subtitle}>주문번호: {orderId}</Text>
        <Text style={styles.amount}>{paymentAmount} WORK</Text>

        {/* 주문 정보 */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            주문이 성공적으로 처리되었습니다.{'\n'}
            주문 내역은 주문 내역에서 확인할 수 있습니다.
          </Text>
        </View>

        {/* 버튼 컨테이너 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.homeButton]}
            onPress={handleGoToHome}
          >
            <Text style={styles.homeButtonText}>홈으로</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.historyButton]}
            onPress={handleGoToOrderHistory}
          >
            <Text style={styles.historyButtonText}>주문 내역</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 5,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 30,
  },
  infoContainer: {
    backgroundColor: '#F8F8F8',
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButton: {
    backgroundColor: '#FF8C00',
  },
  historyButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF8C00',
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyButtonText: {
    color: '#FF8C00',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderCompleteScreen; 