// NotificationScreen.js
import React, { useState, useEffect, useCallback } from 'react';
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
import { get, patch } from '../services/api';
import messaging from '@react-native-firebase/messaging';
import { useFocusEffect } from '@react-navigation/native';

const NotificationScreen = ({ navigation }) => {
 const [notifications, setNotifications] = useState([]);
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [newNotificationReceived, setNewNotificationReceived] = useState(false);
 
 // 무한스크롤을 위한 상태 추가
 const [cursor, setCursor] = useState(null);
 const [hasNextPage, setHasNextPage] = useState(true);
 const [loadingMore, setLoadingMore] = useState(false);
 const PAGE_SIZE = 10; // 한 번에 가져올 알림 개수

 // 컴포넌트 마운트 시 알림 데이터 로드
 useEffect(() => {
   fetchNotifications();
   
   // 포그라운드 메시지 리스너 설정
   const unsubscribe = messaging().onMessage(async (remoteMessage) => {
     console.log('NotificationScreen - 포그라운드 메시지 수신:', remoteMessage);
     
     // 새 알림 수신 표시
     setNewNotificationReceived(true);
     
     // 3초 후 상태 초기화
     setTimeout(() => {
       setNewNotificationReceived(false);
     }, 3000);
     
     // 첫 페이지만 다시 로드 (최신 알림 표시)
     await fetchFirstPage();
   });
   
   return unsubscribe;
 }, []);

 // 화면 포커스 시 알림 목록 새로고침
 useFocusEffect(
   useCallback(() => {
     fetchNotifications();
     return () => {};
   }, [])
 );

 // 첫 페이지만 가져오는 함수 (새로고침 또는 FCM 수신 시 사용)
 // 첫 페이지만 가져오는 함수 수정
const fetchFirstPage = async () => {
  try {
    // 커서 초기화 (첫 페이지부터 다시 불러옴)
    setCursor(null);
    
    // 모든 알림 읽음 처리 API 호출
    try {
      const { ok } = await patch('/notifications/read');
      if (ok) {
        console.log('모든 알림 읽음 처리 성공');
      } else {
        console.warn('모든 알림 읽음 처리 실패');
      }
    } catch (readError) {
      console.error('알림 읽음 처리 API 오류:', readError);
      // 읽음 처리 실패해도 목록 조회는 계속 진행
    }
    
    // API 호출
    const { data, ok } = await get(`/notifications?size=${PAGE_SIZE}`);
    
    if (!ok) {
      throw new Error('알림 목록을 불러오는데 실패했습니다.');
    }
    
    // 응답 데이터 처리
    setNotifications(data.notifications || []);
    setHasNextPage(data.hasNextPage || false);
    setCursor(data.nextCursor);
    
    return true;
  } catch (error) {
    console.error('알림 첫 페이지 조회 오류:', error);
    return false;
  }
};

 // 알림 목록 조회 (API 연동)
 const fetchNotifications = async (isLoadMore = false) => {
  // 이미 로딩 중이거나, 더 불러올 페이지가 없는 경우
  if ((loadingMore && isLoadMore) || (isLoadMore && !hasNextPage)) {
    return;
  }
  
  try {
    if (!isLoadMore) {
      setLoading(true);
      
      // 페이지 첫 로드 시에만 모든 알림 읽음 처리 API 호출
      try {
        const { ok } = await patch('/notifications/read');
        if (ok) {
          console.log('모든 알림 읽음 처리 성공');
        } else {
          console.warn('모든 알림 읽음 처리 실패');
        }
      } catch (readError) {
        console.error('알림 읽음 처리 API 오류:', readError);
        // 읽음 처리 실패해도 목록 조회는 계속 진행
      }
    } else {
      setLoadingMore(true);
    }
    
    // API 엔드포인트 구성 (커서가 있으면 추가)
    let endpoint = `/notifications?size=${PAGE_SIZE}`;
    if (isLoadMore && cursor) {
      endpoint += `&cursor=${cursor}`;
    }
    
    // 알림 목록 조회 API 호출
    const { data, ok } = await get(endpoint);
    
    if (!ok) {
      throw new Error('알림 목록을 불러오는데 실패했습니다.');
    }
    
    // 응답 데이터 처리
    if (isLoadMore) {
      // 기존 목록에 추가
      setNotifications(prev => [...prev, ...(data.notifications || [])]);
    } else {
      // 목록 초기화
      setNotifications(data.notifications || []);
    }
    
    // 다음 페이지 정보 업데이트
    setHasNextPage(data.hasNextPage || false);
    setCursor(data.nextCursor);
    
  } catch (error) {
    console.error('알림 목록 조회 오류:', error);
    if (!isLoadMore) {
      Alert.alert('오류', '알림 목록을 불러오는데 실패했습니다.');
    }
  } finally {
    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
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

 // 새로고침 처리
 const handleRefresh = () => {
   setRefreshing(true);
   // 커서 초기화하고 처음부터 다시 로드
   setCursor(null);
   setHasNextPage(true);
   fetchNotifications();
 };

 // 무한스크롤 처리 - 목록 끝에 도달했을 때 호출
 const handleLoadMore = () => {
   if (hasNextPage && !loadingMore && !loading) {
     fetchNotifications(true);
   }
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
       <Ionicons name="notifications-outline" size={24} color="#FF8C00" />
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

 // 추가 로딩 표시 렌더링
 const renderFooter = () => {
   if (!loadingMore) return null;
   
   return (
     <View style={styles.footerLoading}>
       <ActivityIndicator size="small" color="#FF8C00" />
       <Text style={styles.footerText}>알림 더 불러오는 중...</Text>
     </View>
   );
 };

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

     {/* 새 알림 수신 배너 */}
     {newNotificationReceived && (
       <View style={styles.newNotificationBanner}>
         <Ionicons name="arrow-up" size={20} color="#fff" />
         <Text style={styles.newNotificationText}>새 알림 도착</Text>
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
         keyExtractor={item => item.notificationId.toString()}
         contentContainerStyle={styles.notificationList}
         showsVerticalScrollIndicator={false}
         ListEmptyComponent={renderEmptyNotifications}
         ListFooterComponent={renderFooter}
         refreshing={refreshing}
         onRefresh={handleRefresh}
         onEndReached={handleLoadMore}
         onEndReachedThreshold={0.1}
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
 footerLoading: {
   paddingVertical: 15,
   alignItems: 'center',
   justifyContent: 'center',
   flexDirection: 'row',
 },
 footerText: {
   fontSize: 14,
   color: '#888888',
   marginLeft: 10,
 },
 newNotificationBanner: {
   position: 'absolute',
   top: 0, // 헤더가 제거되었으므로 top 값 수정
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