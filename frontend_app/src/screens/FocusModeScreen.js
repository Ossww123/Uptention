import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, NativeModules, Alert, AppState, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTimer } from '../hooks/useTimer';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config/config';

const { AppBlockerModule } = NativeModules;

const FocusModeScreen = ({ navigation }) => {
  const { time, isActive, startTimer, stopTimer, resetTimer, getTimeInSeconds } = useTimer();
  const [points, setPoints] = useState(0);
  const [appState, setAppState] = useState(AppState.currentState);
  const [isExiting, setIsExiting] = useState(false);
  const totalSecondsRef = useRef(0);
  const { userId, authToken } = useAuth();

  // 포인트 계산 함수
  const calculatePoints = useCallback((seconds) => {
    return Math.floor(seconds / 60);
  }, []);

  // 포인트 업데이트 함수
  const updatePoints = useCallback(() => {
    const totalSeconds = getTimeInSeconds();
    totalSecondsRef.current = totalSeconds;
    const newPoints = calculatePoints(totalSeconds);
    
    if (newPoints !== points) {
      setPoints(newPoints);
      console.log('Points Updated:', {
        previousPoints: points,
        newPoints,
        totalSeconds,
        timeString: time
      });
    }
  }, [getTimeInSeconds, points, time, calculatePoints]);

  // AppState 변경 감지
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log('App State Changed:', { previous: appState, next: nextAppState });
      setAppState(nextAppState);
      
      if (nextAppState === 'active') {
        // 포그라운드로 돌아올 때 즉시 포인트 업데이트
        updatePoints();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [appState, updatePoints]);

  // 포인트 주기적 업데이트
  useEffect(() => {
    // 초기 포인트 설정
    updatePoints();

    // 3초마다 포인트 업데이트 (더 부드러운 UX를 위해)
    const pointsInterval = setInterval(updatePoints, 3000);

    return () => clearInterval(pointsInterval);
  }, [updatePoints]);

  // 컴포넌트 마운트 시 자동으로 타이머 시작 및 앱 제한 기능 활성화
  useEffect(() => {
    const initialize = async () => {
      try {
        // 앱 차단 활성화 및 타이머 시작
        await AppBlockerModule.setAppBlockingEnabled(true);
        startTimer();
        console.log('포커스 모드 시작됨');
      } catch (error) {
        console.error('포커스 모드 시작 실패:', error);
        Alert.alert(
          '알림',
          '포커스 모드를 시작하는데 실패했습니다.',
          [{ text: '확인' }]
        );
      }
    };
    initialize();

    return () => {
      const cleanup = async () => {
        try {
          await AppBlockerModule.setAppBlockingEnabled(false);
          stopTimer();
          resetTimer();
          console.log('포커스 모드 종료됨');
        } catch (error) {
          console.error('포커스 모드 종료 실패:', error);
        }
      };
      cleanup();
    };
  }, []);

  const handleExit = async () => {
    if (!userId || !authToken) {
      Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
      return;
    }

    setIsExiting(true);
    stopTimer();  // 타이머 즉시 중지

    try {
      // 현재 화면에 표시된 포인트 값을 사용
      const finalPoints = points;

      // 포커스 모드 종료 API 호출
      const response = await axios.patch(
        `${API_BASE_URL}/api/mining-time/focus`,
        {
          totalTime: finalPoints  // 현재 표시된 포인트 값 전송
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        console.log('포커스 모드 종료 API 호출 성공');
        
        // API 호출 성공 후 앱 차단 해제
        if (Platform.OS === 'android') {
          await AppBlockerModule.setAppBlockingEnabled(false);
        }

        // 포인트 업데이트를 위해 최대 3번까지 시도
        let updatedPoint = 0;
        for (let i = 0; i < 2; i++) {
          // 2초씩 대기
          await new Promise(resolve => setTimeout(resolve, 2000));

          // 포인트 조회 시도
          try {
            const pointResponse = await axios.get(`${API_BASE_URL}/api/users/${userId}/point`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });

            console.log(`${i + 1}번째 포인트 조회 응답:`, pointResponse.data);
            
            // 포인트가 0보다 크면 업데이트 성공으로 간주하고 종료
            if (pointResponse.data.point > 0) {
              updatedPoint = pointResponse.data.point;
              break;
            }
          } catch (error) {
            console.error(`${i + 1}번째 포인트 조회 실패:`, error);
          }
        }
        
        stopTimer();
        resetTimer();
        
        navigation.goBack();
        
        console.log('포커스 모드 종료:', {
          totalSeconds: totalSecondsRef.current,
          earnedPoints: finalPoints,
          updatedPoint: updatedPoint
        });
      }
    } catch (error) {
      console.error('포커스 모드 종료 오류:', error);
      if (error.response) {
        console.error('에러 상세 정보:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      Alert.alert(
        '오류',
        '포커스 모드 종료 중 문제가 발생했습니다. 다시 시도해주세요.',
        [{ text: '확인' }]
      );
    } finally {
      setIsExiting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 캐릭터 영역 */}
        <View style={styles.characterContainer}>
          <View style={styles.characterBackground} />
          <Image 
            source={require('../../assets/focus_work.png')}
            style={styles.characterImage}
            resizeMode="contain"
          />
        </View>

        {/* 포인트 표시 */}
        <View style={styles.coinContainer}>
          <Text style={styles.coinText}>+ {points}p</Text>
        </View>

        <View style={styles.bottomContainer}>
          {/* 타이머 */}
          <Text style={styles.timerText}>{time}</Text>

          {/* 종료하기 버튼 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.exitButton,
                isExiting && styles.disabledButton
              ]} 
              onPress={handleExit}
              disabled={isExiting}
            >
              <Text style={styles.buttonText}>
                {isExiting ? '종료 중...' : '종료하기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1D1D',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 200,
  },
  coinContainer: {
   
    alignItems: 'center',
  },
  coinText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  characterContainer: {
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  characterBackground: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  characterImage: {
    width: 200,
    height: 200,
    zIndex: 1,
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 64,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    height: 55,
    backgroundColor: '#FF8C00',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  exitButton: {
    backgroundColor: '#FF8C00',
  },
  disabledButton: {
    backgroundColor: '#555555',
  },
});

export default FocusModeScreen; 