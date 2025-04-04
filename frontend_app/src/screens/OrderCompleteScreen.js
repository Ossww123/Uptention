import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OrderCompleteScreen = ({ navigation, route }) => {
  const { orderId, paymentAmount } = route.params;

  const handleGoToHome = () => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Main',
          state: {
            routes: [
              {
                name: 'Store',
                state: {
                  routes: [{ name: 'StoreMain' }],
                  index: 0,
                }
              }
            ],
            index: 0,
          }
        }
      ]
    });
  };

  const handleGoToOrderHistory = () => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Main',
          state: {
            routes: [
              {
                name: 'Profile',
                state: {
                  routes: [{ name: 'OrderHistory' }],
                  index: 0,
                }
              }
            ],
            index: 0,
          }
        }
      ]
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleGoToHome}
        >
          <Ionicons name="close" size={28} color="#000000" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* 로딩 인디케이터 */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
        </View>

        <Text style={styles.title}>주문이 접수되었습니다</Text>
        <Text style={styles.subtitle}>결제 상태는 주문 내역에서 확인하실 수 있습니다</Text>
        
        <View style={styles.orderInfoContainer}>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>주문번호</Text>
            <Text style={styles.orderInfoValue}>{orderId}</Text>
          </View>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>결제금액</Text>
            <Text style={styles.orderInfoValue}>{paymentAmount} WORK</Text>
          </View>
        </View>

        {/* 주문 정보 */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={24} color="#666666" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            블록체인 네트워크를 통한 결제는{'\n'}
            자동으로 처리되며 주문 내역에 반영됩니다.
          </Text>
        </View>

        {/* 버튼 컨테이너 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.historyButton]}
            onPress={handleGoToOrderHistory}
          >
            <Text style={styles.historyButtonText}>주문 내역 확인하기</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.homeButton]}
            onPress={handleGoToHome}
          >
            <Text style={styles.homeButtonText}>쇼핑 계속하기</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 30,
    textAlign: 'center',
  },
  orderInfoContainer: {
    width: '100%',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orderInfoLabel: {
    fontSize: 15,
    color: '#666666',
  },
  orderInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    padding: 15,
    borderRadius: 12,
    marginBottom: 40,
    width: '100%',
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF8C00',
  },
  historyButton: {
    backgroundColor: '#FF8C00',
  },
  homeButtonText: {
    color: '#FF8C00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderCompleteScreen; 