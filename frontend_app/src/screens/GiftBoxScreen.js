import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  RefreshControl,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { getGifts } from '../api/gift';

const GiftBoxScreen = () => {
  const [activeTab, setActiveTab] = useState('PENDING');
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const navigation = useNavigation();
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
        giftsLength: gifts.length,
        isInitialLoad: isInitialLoadRef.current,
        loadRequested: loadRequestedRef.current
      });

      // 이전에 이미 요청했는지 확인
      if (!loadRequestedRef.current) {
        if (isInitialLoadRef.current) {
          console.log('최초 로드 실행');
          loadRequestedRef.current = true;
          fetchGifts(null, true);
          isInitialLoadRef.current = false;
        } else {
          console.log('이미 로드됨, 데이터 갱신');
          fetchGifts(null, true);
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
    setGifts([]);
    setCursor(null);
    setHasNextPage(true);
    fetchGifts(null, true);
  }, [activeTab]);

  const fetchGifts = async (newCursor = null, refresh = false) => {
    try {
      const callId = Date.now();
      console.log(`fetchGifts 시작 (${callId})`, {
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

      const response = await getGifts(authToken, newCursor, 10, activeTab);

      const { giftItems, hasNextPage: nextPage, nextCursor } = response;
      
      if (refresh) {
        setGifts(giftItems);
      } else {
        setGifts(prev => {
          const newGifts = [...prev];
          giftItems.forEach(item => {
            if (!newGifts.some(gift => gift.id === item.id)) {
              newGifts.push(item);
            }
          });
          return newGifts;
        });
      }
      
      setHasNextPage(nextPage);
      setCursor(nextCursor);
    } catch (error) {
      console.error('선물 목록 조회 오류:', error);
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

  // 새로고침 처리
  const onRefresh = () => {
    setRefreshing(true);
    setGifts([]);
    setCursor(null);
    setHasNextPage(true);
    fetchGifts(null, true);
  };

  // 무한 스크롤 처리 (디바운싱 적용)
  const handleLoadMore = useCallback(() => {
    if (onEndReachedTimeoutRef.current) {
      clearTimeout(onEndReachedTimeoutRef.current);
    }

    onEndReachedTimeoutRef.current = setTimeout(() => {
      if (hasNextPage && !loading && cursor) {
        fetchGifts(cursor);
      }
    }, 200);
  }, [loading, hasNextPage, cursor]);

  const handleGiftPress = (item) => {
    navigation.navigate('GiftDetail', { 
      item,
      refreshKey: Date.now()
    });
  };

  const renderGiftItem = ({ item, index }) => {
    if (index % 2 === 0) {
      const nextItem = gifts[index + 1];
      return (
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.giftItem}
            onPress={() => handleGiftPress(item)}
          >
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.giftImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.giftImage, styles.defaultImageContainer]}>
                <Text style={styles.defaultImageText}>선물 이미지</Text>
              </View>
            )}
            <View style={styles.giftInfo}>
              <Text style={styles.giftBrand}>{item.brand}</Text>
              <Text style={styles.giftName} numberOfLines={1}>
                {item.itemName}
              </Text>
              <Text style={[
                styles.giftStatus,
                item.status === '수령 대기' ? styles.statusPending : styles.statusReceived
              ]}>
                {item.status}
              </Text>
            </View>
          </TouchableOpacity>

          {nextItem && (
            <TouchableOpacity
              style={styles.giftItem}
              onPress={() => handleGiftPress(nextItem)}
            >
              {nextItem.imageUrl ? (
                <Image
                  source={{ uri: nextItem.imageUrl }}
                  style={styles.giftImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.giftImage, styles.defaultImageContainer]}>
                  <Text style={styles.defaultImageText}>선물 이미지</Text>
                </View>
              )}
              <View style={styles.giftInfo}>
                <Text style={styles.giftBrand}>{nextItem.brand}</Text>
                <Text style={styles.giftName} numberOfLines={1}>
                  {nextItem.itemName}
                </Text>
                <Text style={[
                  styles.giftStatus,
                  nextItem.status === '수령 대기' ? styles.statusPending : styles.statusReceived
                ]}>
                  {nextItem.status}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return null;
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  };

  const renderEmpty = () => {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>받은 선물이 없습니다.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      {/* 탭 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'PENDING' && styles.activeTab]}
          onPress={() => setActiveTab('PENDING')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'PENDING' && styles.activeTabText
          ]}>수령 대기</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'RECEIVED' && styles.activeTab]}
          onPress={() => setActiveTab('RECEIVED')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'RECEIVED' && styles.activeTabText
          ]}>수령 완료</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={gifts}
        renderItem={renderGiftItem}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        contentContainerStyle={[
          styles.scrollContent,
          gifts.length === 0 && styles.emptyListContent
        ]}
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
      />
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const itemWidth = (width - 60) / 2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: -15,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  itemContainer: {
    width: itemWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: itemWidth,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  placeholderText: {
    color: '#999999',
    fontSize: 14,
  },
  itemInfo: {
    padding: 10,
  },
  storeName: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  bottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sender: {
    fontSize: 12,
    color: '#333333',
  },
  date: {
    fontSize: 12,
    color: '#999999',
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
  giftItem: {
    width: itemWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  giftImage: {
    width: '100%',
    height: itemWidth,
    borderRadius: 10,
    backgroundColor: '#F0F0F0'
  },
  defaultImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultImageText: {
    fontSize: 14,
    color: '#999999',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999999',
    fontSize: 14,
  },
  giftInfo: {
    padding: 10,
  },
  giftBrand: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  giftName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  giftStatus: {
    fontSize: 12,
    color: '#999999',
  },
  statusPending: {
    color: '#FF8C00',
  },
  statusReceived: {
    color: '#999999',
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

export default GiftBoxScreen; 