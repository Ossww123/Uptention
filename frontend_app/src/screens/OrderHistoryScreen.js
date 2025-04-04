import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
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

  // refs for debouncing and request tracking
  const onEndReachedTimeoutRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const currentApiCallIdRef = useRef(null);
  const requestTimerRef = useRef(null);
  const loadRequestedRef = useRef(false);

  // 첫 마운트 시에만 실행되는 useEffect
  useEffect(() => {
    return () => {
      if (onEndReachedTimeoutRef.current) {
        clearTimeout(onEndReachedTimeoutRef.current);
      }
      if (requestTimerRef.current) {
        clearTimeout(requestTimerRef.current);
      }
    };
  }, []);

  // 화면에 포커스가 될 때마다 실행
  useFocusEffect(
    useCallback(() => {
      console.log('useFocusEffect 실행됨', {
        productsLength: orders.length,
        isInitialLoad: isInitialLoadRef.current,
        loadRequested: loadRequestedRef.current
      });

      // 이전에 이미 요청했는지 확인
      if (!loadRequestedRef.current) {
        if (isInitialLoadRef.current) {
          console.log('최초 로드 실행');
          loadRequestedRef.current = true;
          fetchOrders(null, true);
          isInitialLoadRef.current = false;
        } else {
          console.log('이미 로드됨, 데이터 갱신');
          fetchOrders(null, true);
        }
      } else {
        console.log('이전 포커스 이벤트에서 이미 로드 요청됨, 중복 요청 방지');
      }

      // 화면이 언마운트되면 로드 요청 플래그 초기화
      return () => {
        loadRequestedRef.current = false;
      };
    }, [activeTab]) // activeTab이 변경될 때마다 실행
  );

  // 탭 변경 시 데이터 초기화 및 로드
  useEffect(() => {
    if (isInitialLoadRef.current) return; // 최초 로드 시에는 실행하지 않음
    
    console.log('탭 변경으로 인한 데이터 로드');
    setOrders([]);
    setCursor(null);
    setHasNextPage(true);
    fetchOrders(null, true);
  }, [activeTab]);

  const fetchOrders = async (newCursor = null, refresh = false) => {
    try {
      const callId = Date.now();
      console.log(`fetchOrders 시작 (${callId})`, {
        refresh,
        loading,
        hasNextPage,
        currentApiCallId: currentApiCallIdRef.current,
        requestTimer: requestTimerRef.current !== null
      });

      // 더블 요청 방지 타이머 체크
      if (requestTimerRef.current) {
        console.log(`더블 요청 방지 타이머 활성화, 요청 무시 (${callId})`);
        return;
      }

      // 진행 중인 API 호출 체크
      if (loading || currentApiCallIdRef.current) {
        console.log(`이미 로딩 중, 요청 무시 (${callId})`);
        return;
      }

      // 더블 요청 방지 타이머 설정 (1초)
      requestTimerRef.current = setTimeout(() => {
        requestTimerRef.current = null;
      }, 1000);

      // 현재 API 호출 ID 설정
      currentApiCallIdRef.current = callId;

      // 다음 페이지가 없고 리프레시가 아닐 경우 무시
      if (!hasNextPage && !refresh) {
        console.log(`다음 페이지 없음, 요청 무시 (${callId})`);
        currentApiCallIdRef.current = null;
        return;
      }

      setLoading(true);
      if (refresh) {
        setRefreshing(true);
        setCursor(null);
      }

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
      
      if (refresh) {
        setOrders(orderItems);
      } else {
        setOrders(prev => {
          const newOrders = [...prev];
          orderItems.forEach(item => {
            if (!newOrders.some(order => order.orderItemId === item.orderItemId)) {
              newOrders.push(item);
            }
          });
          return newOrders;
        });
      }
      
      setHasNextPage(nextPage);
      setCursor(nextCursor);
    } catch (error) {
      console.error('주문 내역 조회 오류:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      currentApiCallIdRef.current = null;
      if (requestTimerRef.current) {
        clearTimeout(requestTimerRef.current);
        requestTimerRef.current = null;
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setOrders([]);
    setCursor(null);
    setHasNextPage(true);
    fetchOrders(null, true);
  };

  // 무한 스크롤 처리 (디바운싱 적용)
  const handleLoadMore = useCallback(() => {
    if (onEndReachedTimeoutRef.current) {
      clearTimeout(onEndReachedTimeoutRef.current);
    }

    onEndReachedTimeoutRef.current = setTimeout(() => {
      if (hasNextPage && !loading && cursor) {
        fetchOrders(cursor);
      }
    }, 200);
  }, [loading, hasNextPage, cursor]);

  const handleOrderPress = (order) => {
    setSelectedOrder(order);
    setIsBottomSheetVisible(true);
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
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

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>주문 내역이 없습니다.</Text>
      </View>
    );
  };

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

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.orderItemId.toString()}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        removeClippedSubviews={false}
        contentContainerStyle={orders.length === 0 ? styles.emptyListContent : null}
      />

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
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

export default OrderHistoryScreen;

