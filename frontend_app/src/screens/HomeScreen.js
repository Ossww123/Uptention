import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

const HomeScreen = ({ navigation }) => {
  // 프로그레스바 관련 계산
  const size = 280;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circum = radius * 2 * Math.PI;
  const progress = 30;  // progress가 클수록 프로그레스바는 줄어듦
  const svgProgress = (progress * circum) / 100;  // 이 계산식으로 하면 progress가 
                                                 // 커질수록 프로그레스바가 줄어듦
  
  // 예: progress가
  // 100일 때 -> 프로그레스바 완전히 사라짐
  // 75일 때 -> 프로그레스바 1/4만 남음
  // 50일 때 -> 프로그레스바 절반 남음
  // 25일 때 -> 프로그레스바 3/4 남음
  // 0일 때 -> 프로그레스바 완전히 채워짐

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={{fontSize: 16, fontWeight: 'bold'}}>소속</Text>
            <View style={styles.iconContainer}>
              <Ionicons name="medal-outline" size={20} />
              <Ionicons name="notifications-outline" size={20} />
            </View>
          </View>
          <View style={styles.subHeader}>
            <Text style={styles.nameText}>홍길동</Text>
            <View style={styles.walletContainer}>
              <Text style={styles.walletWorkToken}>1000 </Text>
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
                    strokeLinecap="butt"
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
                  <Text style={styles.valueText}>8.00/</Text>
                  <Text style={styles.maxText}>8</Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { backgroundColor: '#0F51F6', width: '100%' }]} />
              </View>
            </View>

            {/* 에너지 섹션 */}
            <View style={styles.progressSection}>
              <View style={styles.headerRow}>
                <Text style={styles.labelText}>에너지</Text>
                <View style={styles.progressInfo}>
                  <Text style={styles.valueText}>8.00/</Text>
                  <Text style={styles.maxText}>8</Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { backgroundColor: '#00C862', width: '100%' }]} />
              </View>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.workModeStartButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('FocusMode')}
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
    height: 20,
    alignItems: 'center',
    marginTop: 50,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  subHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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