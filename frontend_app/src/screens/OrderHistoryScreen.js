import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_BASE_URL } from '../config/config';
import { useAuth } from '../contexts/AuthContext';
import OrderDetailBottomSheet from '../components/OrderDetailBottomSheet';

const OrderHistoryScreen = () => {
  const [activeTab, setActiveTab] = useState('PURCHASE');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const { authToken } = useAuth();

  const fetchOrders = async (newCursor = null, refresh = false) => {
    if (loading || (!hasNextPage && !refresh)) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        params: {
          cursor: newCursor,
          size: 10,
          type: activeTab
        }
      });

      console.log('주문 내역 응답:', response.data);

      const { orderItems, hasNextPage: nextPage, nextCursor } = response.data;
      
      setOrders(prev => refresh ? orderItems : [...prev, ...orderItems]);
      setHasNextPage(nextPage);
      setCursor(nextCursor);
    } catch (error) {
      console.error('주문 내역 조회 오류:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(null, true);
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(null, true);
  };

  const handleOrderPress = (order) => {
    setSelectedOrder(order);
    setIsBottomSheetVisible(true);
  };

  const renderOrderItem = (item) => (
    <TouchableOpacity 
      key={item.orderItemId.toString()}
      style={styles.orderItem}
      onPress={() => handleOrderPress(item)}
    >
      <View style={styles.orderLeft}>
        <Text style={styles.orderStatus}>{item.status}</Text>
        <Text style={styles.orderTitle} numberOfLines={1} ellipsizeMode="tail">
          {item.itemName}
        </Text>
      </View>
      <View style={styles.orderRight}>
        <Text style={styles.orderAmount}>-{item.totalPrice.toLocaleString()} WORK</Text>
        <Text style={styles.orderDate}>
          {new Date(item.orderDate).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).split(' ').join('')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'PURCHASE' && styles.activeTab]}
          onPress={() => setActiveTab('PURCHASE')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'PURCHASE' && styles.activeTabText
          ]}>구매 목록</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'GIFT' && styles.activeTab]}
          onPress={() => setActiveTab('GIFT')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'GIFT' && styles.activeTabText
          ]}>선물 목록</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.orderList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isEndReached = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isEndReached && hasNextPage && !loading) {
            fetchOrders(cursor);
          }
        }}
        scrollEventThrottle={400}
      >
        {orders.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>주문 내역이 없습니다.</Text>
          </View>
        ) : (
          <>
            {orders.map(item => renderOrderItem(item))}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF8C00" />
              </View>
            )}
          </>
        )}
      </ScrollView>

      <OrderDetailBottomSheet
        visible={isBottomSheetVisible}
        onClose={() => setIsBottomSheetVisible(false)}
        orderId={selectedOrder?.orderId}
        orderItemId={selectedOrder?.orderItemId}
        type={activeTab}
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
  orderLeft: {
    flex: 1,
    paddingRight: 16,
    maxWidth: '60%',
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
    width: 140,
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: 14,
    color: '#FF8C00',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'right',
  },
  orderDate: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
});

export default OrderHistoryScreen;

