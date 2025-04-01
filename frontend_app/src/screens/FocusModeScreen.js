import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, NativeModules, Alert, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTimer } from '../hooks/useTimer';
import axios from 'axios';
import { API_BASE_URL } from '../config/config';

const { AppBlockerModule } = NativeModules;

const FocusModeScreen = ({ navigation }) => {
  const { time, isActive, startTimer, stopTimer, resetTimer, getTimeInSeconds } = useTimer();
  const [points, setPoints] = useState(0);
  const [appState, setAppState] = useState(AppState.currentState);
  const totalSecondsRef = useRef(0);

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
    try {
      await AppBlockerModule.setAppBlockingEnabled(false);
      const finalSeconds = getTimeInSeconds();
      const finalPoints = Math.floor(finalSeconds / 60);
      
      // 포커스 모드 종료 API 호출
      await axios.patch(
        `${API_BASE_URL}/api/mining-time/focus/4`,
        null,
        {
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJjYXRlZ29yeSI6IkF1dGhvcml6YXRpb24iLCJ1c2VySWQiOjQsInJvbGUiOiJST0xFX0FETUlOIiwiaWF0IjoxNzQzMzg0NTI1LCJleHAiOjE3NDU5NzY1MjV9.xUPE1swCITKU4f9vdxqnmUDo2N2kRkv4Ig41jWrBb4o',
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('포커스 모드 종료 API 호출 성공');

      // 포인트 업데이트를 위해 최대 3번까지 시도
      let updatedPoint = 0;
      for (let i = 0; i < 3; i++) {
        // 2초씩 대기
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 포인트 조회 시도
        try {
          const pointResponse = await axios.get(`${API_BASE_URL}/api/users/4/point`, {
            headers: {
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJjYXRlZ29yeSI6IkF1dGhvcml6YXRpb24iLCJ1c2VySWQiOjQsInJvbGUiOiJST0xFX0FETUlOIiwiaWF0IjoxNzQzMzg0NTI1LCJleHAiOjE3NDU5NzY1MjV9.xUPE1swCITKU4f9vdxqnmUDo2N2kRkv4Ig41jWrBb4o'
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
        totalSeconds: finalSeconds,
        earnedPoints: finalPoints,
        updatedPoint: updatedPoint
      });
    } catch (error) {
      console.error('포커스 모드 종료 실패:', error);
      console.error('에러 상세 정보:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      Alert.alert(
        '알림',
        '포커스 모드 종료에 실패했습니다.',
        [{ text: '확인', onPress: () => navigation.goBack() }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 포인트 표시 */}
        <View style={styles.coinContainer}>
          <Text style={styles.coinText}>+ {points}p</Text>
        </View>

        {/* 캐릭터 영역 */}
        <View style={styles.characterContainer}>
          {/* 여기에 캐릭터 이미지나 애니메이션이 들어갈 수 있습니다 */}
        </View>

        <View style={styles.bottomContainer}>
          {/* 타이머 */}
          <Text style={styles.timerText}>{time}</Text>

          {/* 종료하기 버튼 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.exitButton]} 
              onPress={handleExit}
            >
              <Text style={styles.buttonText}>종료하기</Text>
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
});

export default FocusModeScreen; 