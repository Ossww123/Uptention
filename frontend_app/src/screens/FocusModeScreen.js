import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, NativeModules, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTimer } from '../hooks/useTimer';

const { AppBlockerModule } = NativeModules;

const FocusModeScreen = ({ navigation }) => {
  const { time, isActive, startTimer, stopTimer, resetTimer } = useTimer();
  const [points, setPoints] = useState(0);
  const [lastMinute, setLastMinute] = useState(0);

  // 타이머 시간을 분으로 변환하는 함수
  const getMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 포인트 업데이트 로직
  useEffect(() => {
    const currentMinute = getMinutes(time);
    if (currentMinute > lastMinute && currentMinute > 0) {
      setPoints(prev => prev + 1);
      setLastMinute(currentMinute);
    }
  }, [time]);

  // 컴포넌트 마운트 시 자동으로 타이머 시작 및 앱 제한 기능 활성화
  useEffect(() => {
    const initialize = async () => {
      try {
        await AppBlockerModule.setAppBlockingEnabled(true);
        startTimer();
        console.log('포커스 모드 시작됨');
      } catch (error) {
        console.error('포커스 모드 시작 실패:', error);
        Alert.alert(
          '알림',
          '앱 제한 기능을 활성화하는데 실패했습니다.',
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
      stopTimer();
      resetTimer();
      navigation.goBack();
    } catch (error) {
      console.error('포커스 모드 종료 실패:', error);
      Alert.alert(
        '알림',
        '앱 제한 기능 비활성화에 실패했습니다. 설정에서 직접 비활성화해주세요.',
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