import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Platform,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { NativeModules } from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from '../services/AuthService';
import messaging from '@react-native-firebase/messaging';
import { useFocusEffect} from '@react-navigation/native';

const { AppBlockerModule } = NativeModules;

const HomeScreen = ({ navigation }) => {
  const { tokenBalance, publicKey } = useWallet();
  const { userId, authToken, loadUserData } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [userPoint, setUserPoint] = useState(0);
  const [dailyFocusTime, setDailyFocusTime] = useState(0);

  // 앱제한 관련 권한 상태 관리
  const [hasAccessibilityPermission, setHasAccessibilityPermission] = useState(false);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(false);
  
  // 읽지 않은 알림 개수 상태 (FCM 푸시 알림으로 업데이트)
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  
  // 프로그레스바 관련 계산
  const size = 280;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circum = radius * 2 * Math.PI;
  const maxFocusHours = 8; // 최대 8시간
  const maxFocusMinutes = maxFocusHours * 60; // 480분
  const remainingMinutes = maxFocusMinutes - dailyFocusTime; // 남은 시간 계산
  const progress = (remainingMinutes / maxFocusMinutes) * 100; // 남은 시간의 비율
  const svgProgress = (progress * circum) / 100; // progress가 클수록 비어있는 상태

  // FCM 메시지 리스너 설정
useEffect(() => {
  // 포그라운드 메시지 리스너
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log('HomeScreen - 포그라운드 메시지 수신:', remoteMessage);
    
    // 알림 받은 후 최신 알림 개수 조회
    try {
      const { data, ok } = await get('/notifications/unread/count');
      if (ok) {
        setUnreadNotifications(data.count);
      }
    } catch (error) {
      console.error('알림 개수 조회 오류:', error);
      // API 호출 실패 시 기존 방식으로 알림 개수 증가
      setUnreadNotifications(prev => prev + 1);
    }
    
    // 알림 내용 확인 (옵션)
    const notificationTitle = remoteMessage.notification?.title || '새 알림';
    const notificationBody = remoteMessage.notification?.body || '새 알림이 도착했습니다';
    
    console.log(`알림 내용: ${notificationTitle} - ${notificationBody}`);
  });
  
  return unsubscribe;
}, []);

  useFocusEffect(
    useCallback(() => {
      // 화면이 포커스될 때마다 알림 카운트 조회 API 호출
      const fetchUnreadNotificationCount = async () => {
        try {
          const { data, ok } = await get('/notifications/unread/count');
          if (ok) {
            setUnreadNotifications(data.count);
          }
        } catch (error) {
          console.error('알림 개수 조회 오류:', error);
        }
      };
  
      fetchUnreadNotificationCount();
      
      return () => {
        // 클린업 코드 (필요시)
      };
    }, [])
  );
  
  // JWT 토큰에서 payload를 추출하는 함수
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('JWT 파싱 오류:', error);
      return null;
    }
  };

  // 컴포넌트 마운트 시 사용자 데이터 로드
  useEffect(() => {
    loadUserData();
  }, []);

  // 앱 권한 상태 확인
  useEffect(() => {
    if (Platform.OS === 'android') {
      if (!AppBlockerModule) {
        console.error('AppBlockerModule이 로드되지 않았습니다.');
      } else {
        checkAppBlockerPermissions();
      }
    }
  }, []);
  
  // 앱 차단 권한 확인 함수
  const checkAppBlockerPermissions = async () => {
    try {
      if (AppBlockerModule) {
        const accessibility = await AppBlockerModule.isAccessibilityServiceEnabled();
        const overlay = await AppBlockerModule.hasOverlayPermission();
        
        console.log('접근성 서비스 권한 상태:', accessibility);
        console.log('화면 오버레이 권한 상태:', overlay);
        
        setHasAccessibilityPermission(accessibility);
        setHasOverlayPermission(overlay);
      }
    } catch (error) {
      console.error('권한 확인 오류:', error);
    }
  };
  
  // 집중 모드 시작 함수
  const startFocusMode = async () => {
    if (!userId || !authToken) {
      Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
      return;
    }

    try {
      // 집중 모드 시작 API 호출
      const response = await axios.post(
        `${API_BASE_URL}/api/mining-time/focus`,
        {
          latitude: 36.1071,  // 위도 정보
          longitude: 128.416 // 경도 정보
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 200) {
        console.log('집중 모드 시작 API 호출 성공');
        
        if (Platform.OS === 'android') {
          try {
            await AppBlockerModule.setAppBlockingEnabled(true);
            console.log('앱 차단 기능 활성화 성공');
          } catch (error) {
            console.error('앱 차단 기능 활성화 실패:', error);
          }
        }
        
        navigation.navigate('FocusMode');
      }
    } catch (error) {
      console.error('집중 모드 시작 API 호출 실패:', error);
      console.error('에러 상세 정보:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      Alert.alert(
        '오류 발생',
        '집중 모드를 시작할 수 없습니다. 다시 시도해주세요.',
        [{ text: '확인' }]
      );
    }
  };
  
  // 앱 차단에 필요한 권한 요청
  const requestAppBlockerPermissions = async () => {
    try {
      if (!hasAccessibilityPermission) {
        Alert.alert(
          '접근성 권한 필요',
          '앱 제한 기능을 사용하기 위해서는 접근성 권한이 필요합니다.\n\n설정 > 접근성 > 설치된 앱 > Uptention > 허용',
          [
            { 
              text: '취소', 
              style: 'cancel' 
            },
            {
              text: '설정으로 이동',
              onPress: async () => {
                try {
                  await AppBlockerModule.openAccessibilitySettings();
                  // 설정 화면에서 돌아온 후 권한 상태 다시 확인
                  setTimeout(async () => {
                    const newStatus = await AppBlockerModule.isAccessibilityServiceEnabled();
                    setHasAccessibilityPermission(newStatus);
                    if (newStatus && !hasOverlayPermission) {
                      requestAppBlockerPermissions(); // 다음 권한 요청
                    }
                  }, 1000);
                } catch (error) {
                  console.error('접근성 설정 화면 열기 실패:', error);
                }
              }
            }
          ]
        );
      } else if (!hasOverlayPermission) {
        Alert.alert(
          '화면 오버레이 권한 필요',
          '앱 제한 기능을 사용하기 위해서는 화면 오버레이 권한이 필요합니다.\n\n설정 > 앱 > Uptention > 다른 앱 위에 표시 > 허용',
          [
            { 
              text: '취소', 
              style: 'cancel' 
            },
            {
              text: '설정으로 이동',
              onPress: async () => {
                try {
                  await AppBlockerModule.openOverlaySettings();
                  // 설정 화면에서 돌아온 후 권한 상태 다시 확인
                  setTimeout(async () => {
                    const newStatus = await AppBlockerModule.hasOverlayPermission();
                    setHasOverlayPermission(newStatus);
                  }, 1000);
                } catch (error) {
                  console.error('오버레이 설정 화면 열기 실패:', error);
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('권한 설정 화면 열기 실패:', error);
      Alert.alert(
        '오류 발생',
        '권한 설정 화면을 열 수 없습니다. 설정 앱에서 직접 권한을 설정해주세요.',
        [{ text: '확인' }]
      );
    }
  };

  // 사용자 정보 조회 함수
  const fetchUserInfo = async () => {
    if (!userId || !authToken) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      setUserInfo(response.data);
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
    }
  };

  // 사용자 포인트 조회 함수
  const fetchUserPoint = async () => {
    if (!userId || !authToken) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${userId}/point`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      setUserPoint(response.data.point);
    } catch (error) {
      console.error('포인트 조회 오류:', error);
    }
  };

  // 오늘의 집중 시간 조회 함수
  const fetchDailyFocusTime = async () => {
    if (!userId || !authToken) return;

    try {
      // 오늘 날짜의 시작과 끝 시간 설정
      const now = new Date();
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      // 날짜를 YYYY-MM-DDTHH:mm:ss 형식으로 변환
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };
      
      console.log('API 요청 파라미터:', {
        startTime: formatDate(startTime),
        endTime: formatDate(endTime)
      });

      // API 호출
      const response = await axios.get(
        `${API_BASE_URL}/api/users/${userId}/mining-times`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          params: {
            startTime: formatDate(startTime),
            endTime: formatDate(endTime)
          }
        }
      );
      
      console.log('API 응답 데이터:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        // 집중 시간 세션 로그 출력
        console.log('=== 오늘의 집중 시간 세션 ===');
        let totalMinutes = 0;

        response.data.forEach((session, index) => {
          console.log(`세션 ${index + 1}:`);
          console.log(`날짜: ${session.date}`);
          console.log(`총 시간: ${session.totalTime}분`);
          console.log('------------------------');
          
          // 문자열이나 숫자 모두 처리 가능하도록
          const sessionTime = parseInt(session.totalTime || 0);
          if (!isNaN(sessionTime)) {
            totalMinutes += sessionTime;
          }
        });
        
        console.log(`총 집중 시간: ${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분`);
        setDailyFocusTime(totalMinutes);
      } else {
        console.error('잘못된 응답 형식:', response.data);
        setDailyFocusTime(0);
      }
    } catch (error) {
      console.error('집중 시간 조회 오류:', error);
      if (error.response) {
        console.error('에러 상세 정보:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      setDailyFocusTime(0);
    }
  };

  useEffect(() => {
    if (userId && authToken) {
      fetchUserInfo();
      fetchUserPoint();
      fetchDailyFocusTime();
    }
  }, [userId, authToken]);

  // 화면이 포커스될 때마다 데이터 업데이트
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (userId && authToken) {
        fetchUserPoint();
        fetchDailyFocusTime();
      }
    });

    return unsubscribe;
  }, [navigation, userId, authToken]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.userInfoContainer}>
              <Text style={{fontSize: 16, fontWeight: 'bold'}}>{userInfo?.employeeNumber || '-'}</Text>
              <Text style={styles.nameText}>{userInfo?.name || '-'}</Text>
            </View>
            <View style={styles.iconContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Ranking')}>
                <Ionicons name="medal-outline" size={20} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Notification')}
                style={styles.notificationButton}
              >
                <Ionicons name="notifications-outline" size={20} />
                {unreadNotifications > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{unreadNotifications}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.subHeader}>
            <Text></Text>
            <View style={styles.walletContainer}>
              <Text style={styles.walletWorkToken}>
                {publicKey ? `${tokenBalance} ` : '연결 필요 '}
              </Text>
              <Text style={styles.workText}>WORK</Text>
            </View>
          </View>
          <View style={styles.mainContainer}>
            <View style={styles.progressContainer}>
              <Text style={styles.dailyWorkText}>
                Daily $WORK
              </Text>
              
              <View style={styles.progressBarWrapper}>
                <Svg width={size} height={size}>
                  {/* 밑에 깔리는 회색 원 */}
                  <Circle
                    stroke="#FF8C00"
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                  />
                  {/* 위에 덮이는 주황색 원 */}
                  <Circle
                    stroke="#E0E0E0" 
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeDasharray={circum}
                    strokeDashoffset={svgProgress}
                    strokeLinecap="round"
                    strokeWidth={strokeWidth}
                    transform={`rotate(-90, ${size / 2}, ${size / 2})`}
                  />
                </Svg>
              </View>
            </View>
          </View>
          <View style={styles.subContainer}>
            {/* 포인트 섹션 */}
            <View style={styles.progressSection}>
              <View style={styles.headerRow}>
                <Text style={styles.labelText}>포인트</Text>
                <View style={styles.progressInfo}>
                  <Text style={styles.valueText}>{userPoint}/</Text>
                  <Text style={styles.maxText}>480</Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { backgroundColor: '#0F51F6', width: `${(userPoint / 480) * 100}%` }]} />
              </View>
            </View>

            {/* 에너지 섹션 */}
            <View style={styles.progressSection}>
              <View style={styles.headerRow}>
                <Text style={styles.labelText}>에너지</Text>
                <View style={styles.progressInfo}>
                  <Text style={styles.valueText}>{(remainingMinutes / 60).toFixed(2)}/</Text>
                  <Text style={styles.maxText}>8</Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: '#00C862', 
                    width: `${progress}%` 
                  }
                ]} />
              </View>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.workModeStartButton}
            activeOpacity={0.8}
            onPress={startFocusMode}
          >
            <Text style={styles.buttonText}>집중하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    backgroundColor: '#FDFDFD',
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
 
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 45,
    alignItems: 'center',
    marginTop: 50,
  },
  userInfoContainer: {
    justifyContent: 'center',
  },
  userInfoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#000',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  notificationButton: {
    position: 'relative',
    padding: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF0000',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  subHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletWorkToken: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  workText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  mainContainer: {
    width: '100%',
    height: 345,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 50,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,  // Daily $WORK와 프로그레스바 사이 간격
  },
  dailyWorkText: {
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  progressBarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  subContainer: {
    width: '100%',
    height: 55,
    marginTop: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 0.8,
    flexDirection: 'row',
    paddingVertical: 10,
  },
  progressSection: {
    width: '50%',
    paddingHorizontal: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  labelText: {
    fontSize: 12,
  },
  progressInfo: {
    flexDirection: 'row',
  },
  valueText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  maxText: {
    fontSize: 12,
    color: '#D4D1D1',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  workModeStartButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#FF8C00',
    borderRadius: 10,
    marginTop: 45,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default HomeScreen;