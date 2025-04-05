import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { get } from '../services/api';
import messaging from '@react-native-firebase/messaging';

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newNotificationReceived, setNewNotificationReceived] = useState(false);

  // 더미 데이터 생성 함수
  const generateDummyNotifications = () => {
    return [
      {
        id: '1',
        title: '선물 수령',
        message: '홍길동님이 보낸 스타벅스 아메리카노를 선물받았습니다.',
        createdAt: '2025-03-29T10:30:00',
        read: false,
        type: 'GIFT'
      },
      {
        id: '2',
        title: '우수사원 선정',
        message: '축하합니다! 이번 주 우수사원으로 선정되셨습니다.',
        createdAt: '2025-03-28T14:15:00',
        read: true,
        type: 'AWARD'
      },
      {
        id: '3',
        title: '집중모드 알림',
        message: '오늘 집중모드 8시간을 달성했습니다! 내일도 화이팅하세요.',
        createdAt: '2025-03-28T18:00:00',
        read: false,
        type: 'FOCUS'
      },
      {
        id: '4',
        title: '선물 수령',
        message: '김철수님이 보낸 투썸플레이스 케이크를 선물받았습니다.',
        createdAt: '2025-03-27T09:45:00',
        read: true,
        type: 'GIFT'
      },
      {
        id: '5',
        title: 'NFT 발급',
        message: '우수사원 NFT가 발급되었습니다. 프로필에서 확인해보세요.',
        createdAt: '2025-03-26T11:20:00',
        read: false,
        type: 'NFT'
      },
      {
        id: '6',
        title: 'NFT 발급',
        message: '우수사원 NFT가 발급되었습니다. 프로필에서 확인해보세요.',
        createdAt: '2025-03-26T11:20:00',
        read: false,
        type: 'NFT'
      },
      {
        id: '7',
        title: 'NFT 발급',
        message: '우수사원 NFT가 발급되었습니다. 프로필에서 확인해보세요.',
        createdAt: '2025-03-26T11:20:00',
        read: false,
        type: 'NFT'
      },
      {
        id: '8',
        title: 'NFT 발급',
        message: '우수사원 NFT가 발급되었습니다. 프로필에서 확인해보세요.',
        createdAt: '2025-03-26T11:20:00',
        read: false,
        type: 'NFT'
      },
      {
        id: '9',
        title: 'NFT 발급',
        message: '우수사원 NFT가 발급되었습니다. 프로필에서 확인해보세요.',
        createdAt: '2025-03-26T11:20:00',
        read: false,
        type: 'NFT'
      },
      {
        id: '10',
        title: 'NFT 발급',
        message: '우수사원 NFT가 발급되었습니다. 프로필에서 확인해보세요.',
        createdAt: '2025-03-26T11:20:00',
        read: false,
        type: 'NFT'
      }
    ];
  };

  // 컴포넌트 마운트 시 알림 데이터 로드
  useEffect(() => {
    fetchNotifications();
    
    // 포그라운드 메시지 리스너 설정
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('NotificationScreen - 포그라운드 메시지 수신:', remoteMessage);
      
      // 새 알림 수신 상태 업데이트
      setNewNotificationReceived(true);
      
      // 3초 후 상태 초기화
      setTimeout(() => {
        setNewNotificationReceived(false);
      }, 3000);
      
      // 알림 목록 새로고침 (필요한 경우 주석 해제)
      // fetchNotifications();
    });
    
    return unsubscribe;
  }, []);

  // 알림 목록 조회 (더미 데이터)
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // 실제 API 호출 대신 더미 데이터를 사용
      // const { data, ok } = await get('/notifications');
      // if (!ok) {
      //   throw new Error('알림 목록을 불러오는데 실패했습니다.');
      // }
      
      // 더미 데이터
      const dummyData = generateDummyNotifications();
      
      // 알림 데이터 설정
      setNotifications(dummyData);
    } catch (error) {
      console.error('알림 목록 조회 오류:', error);
      Alert.alert('오류', '알림 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // 오늘
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return `오늘 ${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}`;
    } else if (diffDays === 1) {
      // 어제
      return '어제';
    } else if (diffDays < 7) {
      // 이번 주
      const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
      return days[date.getDay()];
    } else {
      // 그 이전
      return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
    }
  };

  // 알림 유형에 따른 아이콘 선택
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'GIFT':
        return <Ionicons name="gift-outline" size={24} color="#FF8C00" />;
      case 'AWARD':
        return <Ionicons name="trophy-outline" size={24} color="#FF8C00" />;
      case 'FOCUS':
        return <Ionicons name="hourglass-outline" size={24} color="#FF8C00" />;
      case 'NFT':
        return <Ionicons name="medal-outline" size={24} color="#FF8C00" />;
      default:
        return <Ionicons name="notifications-outline" size={24} color="#FF8C00" />;
    }
  };

  // 새로고침 처리
  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // 알림 항목 렌더링
  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem, 
        item.read ? styles.readNotification : styles.unreadNotification
      ]}
    >
      <View style={styles.notificationIconContainer}>
        {getNotificationIcon(item.type)}
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
      </View>
    </TouchableOpacity>
  );

  // 빈 알림 목록 렌더링
  const renderEmptyNotifications = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
      <Text style={styles.emptyText}>알림이 없습니다.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        <View style={{width: 40}} />
      </View>

      {/* 새 알림 수신 배너 */}
      {newNotificationReceived && (
        <View style={styles.newNotificationBanner}>
          <Ionicons name="notifications" size={20} color="#fff" />
          <Text style={styles.newNotificationText}>새 알림이 왔습니다</Text>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
          <Text style={styles.loadingText}>알림을 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.notificationList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyNotifications}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          removeClippedSubviews={false}
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#888888',
    marginTop: 10,
  },
  notificationList: {
    flexGrow: 1,
    padding: 15,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
  },
  readNotification: {
    opacity: 0.8,
  },
  notificationIconContainer: {
    marginRight: 15,
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationDate: {
    fontSize: 12,
    color: '#888',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
  // 새 알림 배너 스타일
  newNotificationBanner: {
    position: 'absolute',
    top: 60, // 헤더 아래에 표시
    left: 20,
    right: 20,
    backgroundColor: '#FF8C00',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  newNotificationText: {
    color: '#fff',
    marginLeft: 10,
    fontWeight: 'bold',
  }
});

export default NotificationScreen;