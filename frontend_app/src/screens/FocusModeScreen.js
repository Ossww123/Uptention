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
  const pointsIntervalRef = useRef(null);
  const { userId, authToken } = useAuth();
  // 마지막으로 계산된 포인트를 저장하는 ref 추가
  const lastCalculatedPointsRef = useRef(0);

  // 포인트 계산 함수 - 순수 계산 함수로 유지
  const calculatePoints = useCallback((seconds) => {
    // 60초(1분)마다 1포인트 증가
    return Math.floor(seconds / 60);
  }, []);

  // 포인트 업데이트 함수
  const updatePoints = useCallback(() => {
    // 종료 중이거나 타이머가 멈춘 상태면 업데이트하지 않음
    if (isExiting || !isActive) {
      return;
    }

    const totalSeconds = getTimeInSeconds();
    const newPoints = calculatePoints(totalSeconds);
    
    if (newPoints !== points) {
      console.log('포인트 업데이트:', {
        totalSeconds,
        newPoints,
        previousPoints: points,
        timeString: time
      });
      setPoints(newPoints);
      // 계산된 포인트를 ref에 저장
      lastCalculatedPointsRef.current = newPoints;
    }
  }, [getTimeInSeconds, points, time, isExiting, isActive, calculatePoints]);

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
    if (isActive && !isExiting) {
      pointsIntervalRef.current = setInterval(updatePoints, 3000);
    }

    return () => {
      if (pointsIntervalRef.current) {
        clearInterval(pointsIntervalRef.current);
        pointsIntervalRef.current = null;
      }
    };
  }, [updatePoints, isActive, isExiting]);

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

    // 먼저 종료 상태로 설정 - 이걸 맨 위로 이동
    setIsExiting(true);
    
    // 타이머 중지
    stopTimer();

    // 포인트 업데이트 인터벌 중지
    if (pointsIntervalRef.current) {
      clearInterval(pointsIntervalRef.current);
      pointsIntervalRef.current = null;
    }
    
    // 종료 시 마지막으로 계산된 포인트 사용
    // 화면에 표시된 포인트를 사용하는 것이 아니라 계산된 포인트를 사용
    const finalPoints = lastCalculatedPointsRef.current;
    
    console.log('종료 시점 상태:', {
      currentPoints: finalPoints,
      displayedTime: time
    });

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/mining-time/focus`,
        {
          totalTime: finalPoints
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
        
        if (Platform.OS === 'android') {
          await AppBlockerModule.setAppBlockingEnabled(false);
        }

        let updatedPoint = 0;
        // 포인트 조회 시도 (최대 2번)
        for (let i = 0; i < 2; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            const pointResponse = await axios.get(`${API_BASE_URL}/api/users/${userId}/point`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });
            if (pointResponse.data.point > 0) {
              updatedPoint = pointResponse.data.point;
              break;
            }
          } catch (error) {
            console.error(`포인트 조회 실패 (${i + 1}번째):`, error);
          }
        }

        resetTimer();
        navigation.goBack();
        
        console.log('포커스 모드 종료 완료:', {
          earnedPoints: finalPoints,
          displayedTime: time,
          updatedPoint
        });
      }
    } catch (error) {
      console.error('포커스 모드 종료 오류:', error);
      Alert.alert(
        '오류',
        '포커스 모드 종료 중 문제가 발생했습니다. 다시 시도해주세요.',
        [{ text: '확인' }]
      );
      // 에러 발생 시 종료 상태 해제
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
            <Text style={styles.noticeText}>
              네트워크에 따른 1-2초의 차이가 있을 수 있습니다.
            </Text>
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
  noticeText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default FocusModeScreen;