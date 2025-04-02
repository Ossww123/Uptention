import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { API_BASE_URL } from '../config/config';
import { useAuth } from '../contexts/AuthContext';

const GiftBoxScreen = () => {
  const [activeTab, setActiveTab] = useState('PENDING');
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const navigation = useNavigation();
  const { authToken } = useAuth();

  const fetchGifts = async (newCursor = null, refresh = false, targetTab = null) => {
    if (loading || (!hasNextPage && !refresh)) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/gifts`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        params: {
          cursor: newCursor,
          size: 10,
          type: targetTab || activeTab
        }
      });

      const { giftItems, hasNextPage: nextPage, nextCursor } = response.data;
      
      if (targetTab) {
        // 특정 탭의 데이터만 새로고침
        setGifts(prev => {
          // 현재 탭의 데이터만 필터링
          const currentTabGifts = prev.filter(gift => 
            (targetTab === 'PENDING' && gift.status === '수령 대기') ||
            (targetTab === 'RECEIVED' && gift.status === '수령 완료')
          );
          return refresh ? giftItems : [...currentTabGifts, ...giftItems];
        });
      } else {
        // 현재 탭의 데이터 새로고침
        setGifts(prev => refresh ? giftItems : [...prev, ...giftItems]);
      }
      
      setHasNextPage(nextPage);
      setCursor(nextCursor);
    } catch (error) {
      console.error('선물 목록 조회 오류:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchGifts(null, true);
  }, [activeTab]);

  // 새로고침 처리
  const onRefresh = () => {
    setRefreshing(true);
    fetchGifts(null, true);
  };

  // 스크롤 끝에서 추가 데이터 로드
  const onEndReached = () => {
    if (!loading && hasNextPage) {
      fetchGifts(cursor);
    }
  };

  const handleGiftPress = (item) => {
    navigation.navigate('GiftDetail', { 
      item,
      refreshKey: Date.now()
    });
  };

  const renderGiftItems = () => {
    if (gifts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>받은 선물이 없습니다.</Text>
        </View>
      );
    }

    const rows = [];
    for (let i = 0; i < gifts.length; i += 2) {
      rows.push(
        <View key={i} style={styles.row}>
          <TouchableOpacity
            style={styles.giftItem}
            onPress={() => handleGiftPress(gifts[i])}
          >
            {gifts[i].imageUrl ? (
              <Image
                source={{ uri: gifts[i].imageUrl }}
                style={styles.giftImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.giftImage, styles.defaultImageContainer]}>
                <Text style={styles.defaultImageText}>선물 이미지</Text>
              </View>
            )}
            <View style={styles.giftInfo}>
              <Text style={styles.giftBrand}>{gifts[i].brand}</Text>
              <Text style={styles.giftName} numberOfLines={1}>
                {gifts[i].itemName}
              </Text>
              <Text style={[
                styles.giftStatus,
                gifts[i].status === '수령 대기' ? styles.statusPending : styles.statusReceived
              ]}>
                {gifts[i].status}
              </Text>
            </View>
          </TouchableOpacity>

          {i + 1 < gifts.length && (
            <TouchableOpacity
              style={styles.giftItem}
              onPress={() => handleGiftPress(gifts[i + 1])}
            >
              {gifts[i + 1].imageUrl ? (
                <Image
                  source={{ uri: gifts[i + 1].imageUrl }}
                  style={styles.giftImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.giftImage, styles.defaultImageContainer]}>
                  <Text style={styles.defaultImageText}>선물 이미지</Text>
                </View>
              )}
              <View style={styles.giftInfo}>
                <Text style={styles.giftBrand}>{gifts[i + 1].brand}</Text>
                <Text style={styles.giftName} numberOfLines={1}>
                  {gifts[i + 1].itemName}
                </Text>
                <Text style={[
                  styles.giftStatus,
                  gifts[i + 1].status === '수령 대기' ? styles.statusPending : styles.statusReceived
                ]}>
                  {gifts[i + 1].status}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return rows;
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

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isEndReached = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isEndReached) {
            onEndReached();
          }
        }}
        scrollEventThrottle={400}
      >
        {renderGiftItems()}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF8C00" />
          </View>
        )}
      </ScrollView>
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
});

export default GiftBoxScreen; 