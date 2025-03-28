import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import OrderDetailBottomSheet from '../components/OrderDetailBottomSheet';

const OrderHistoryScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('purchase'); // 'purchase' or 'gift'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

  const mockOrders = {
    purchase: [
      {
        id: 1,
        type: 'purchase',
        status: '구매 완료',
        title: '두레주로 10000원 교환권',
        amount: '-1000 WORK',
        date: '2025.02.13'
      },
      {
        id: 2,
        type: 'purchase',
        status: '구매 완료',
        title: '두레주로 10000원 교환권',
        amount: '-1000 WORK',
        date: '2025.02.13'
      }
    ],
    gift: [
      {
        id: 3,
        type: 'gift',
        status: '선물 완료',
        title: '두레주로 10000원 교환권',
        amount: '-1000 WORK',
        date: '2025.02.13'
      },
      {
        id: 4,
        type: 'gift',
        status: '선물 완료',
        title: '두레주로 10000원 교환권',
        amount: '-1000 WORK',
        date: '2025.02.13'
      }
    ]
  };

  const handleOrderPress = (order) => {
    setSelectedOrder(order);
    setIsBottomSheetVisible(true);
  };

  const currentOrders = mockOrders[activeTab] || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* 탭 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'purchase' && styles.activeTab]}
          onPress={() => setActiveTab('purchase')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'purchase' && styles.activeTabText
          ]}>구매 목록</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'gift' && styles.activeTab]}
          onPress={() => setActiveTab('gift')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'gift' && styles.activeTabText
          ]}>선물 목록</Text>
        </TouchableOpacity>
      </View>

      {/* 주문 목록 */}
      <ScrollView style={styles.orderList}>
        {currentOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderItem}
            onPress={() => handleOrderPress(order)}
          >
            <View>
              <Text style={styles.orderStatus}>{order.status}</Text>
              <Text style={styles.orderTitle}>{order.title}</Text>
            </View>
            <View style={styles.orderRight}>
              <Text style={styles.orderAmount}>{order.amount}</Text>
              <Text style={styles.orderDate}>{order.date}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 주문 상세 바텀 시트 */}
      <OrderDetailBottomSheet
        visible={isBottomSheetVisible}
        onClose={() => setIsBottomSheetVisible(false)}
        order={selectedOrder}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF8C00',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
  },
  activeTabText: {
    color: '#FF8C00',
    fontWeight: '600',
  },
  orderList: {
    flex: 1,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  orderStatus: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  orderTitle: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: 14,
    color: '#FF8C00',
    fontWeight: '600',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#999999',
  }
});

export default OrderHistoryScreen; 