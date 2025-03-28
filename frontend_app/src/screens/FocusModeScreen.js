import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FocusModeScreen = ({ navigation }) => {
  const [time, setTime] = useState('00:00:00');
  const [points, setPoints] = useState({ current: 8, max: 8 });
  const [energy, setEnergy] = useState({ current: 8, max: 8 });
  const [coins, setCoins] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 코인 표시 */}
        <View style={styles.coinContainer}>
          <Text style={styles.coinText}>+ {coins}p</Text>
        </View>

        {/* 캐릭터 영역 */}
        <View style={styles.characterContainer}>
          {/* 여기에 캐릭터 이미지나 애니메이션이 들어갈 수 있습니다 */}
        </View>

        <View style={styles.bottomContainer}>
          {/* 프로그레스 바 영역 */}
          <View style={styles.progressWrapper}>
            <View style={styles.progressContainer}>
              {/* 포인트 섹션 */}
              <View style={styles.progressSection}>
                <View style={styles.headerRow}>
                  <Text style={styles.labelText}>포인트</Text>
                  <View style={styles.progressInfo}>
                    <Text style={styles.valueText}>{points.current.toFixed(2)}/</Text>
                    <Text style={styles.maxText}>{points.max}</Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        backgroundColor: '#2F2F2F', 
                        width: `${(points.current / points.max) * 100}%` 
                      }
                    ]} 
                  />
                </View>
              </View>

              {/* 에너지 섹션 */}
              <View style={styles.progressSection}>
                <View style={styles.headerRow}>
                  <Text style={styles.labelText}>에너지</Text>
                  <View style={styles.progressInfo}>
                    <Text style={styles.valueText}>{energy.current.toFixed(2)}/</Text>
                    <Text style={styles.maxText}>{energy.max}</Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        backgroundColor: '#404040', 
                        width: `${(energy.current / energy.max) * 100}%` 
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>
          </View>

          {/* 타이머 */}
          <Text style={styles.timerText}>{time}</Text>

          {/* 종료하기 버튼 */}
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>종료하기</Text>
          </TouchableOpacity>
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
  progressWrapper: {
    width: '100%',
    backgroundColor: '#272626',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
  },
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
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
    color: '#FFFFFF',
  },
  progressInfo: {
    flexDirection: 'row',
  },
  valueText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  maxText: {
    fontSize: 12,
    color: '#D4D1D1',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 64,
    fontWeight: 'bold',
    marginBottom: 40,
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
});

export default FocusModeScreen; 