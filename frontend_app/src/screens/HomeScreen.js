import React, { useEffect, useState } from 'react';
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

const { AppBlockerModule } = NativeModules;

const HomeScreen = ({ navigation }) => {
  const { tokenBalance, isWalletConnected } = useWallet();

  // 앱제한 관련 권한 상태 관리
  const [hasAccessibilityPermission, setHasAccessibilityPermission] = useState(false);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(false);
  
  // 프로그레스바 관련 계산
  const size = 280;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circum = radius * 2 * Math.PI;
  const progress = 30;  // progress가 클수록 프로그레스바는 줄어듦
  const svgProgress = (progress * circum) / 100;  // 이 계산식으로 하면 progress가 
                                                 // 커질수록 프로그레스바가 줄어듦
  
  // 앱 권한 상태 확인 (컴포넌트 마운트시 실행)
  useEffect(() => {
    if (Platform.OS === 'android') {
      // AppBlockerModule이 제대로 로드됐는지 확인
      console.log('AppBlockerModule 확인:', AppBlockerModule);
      
      if (!AppBlockerModule) {
        console.error('AppBlockerModule이 로드되지 않았습니다.');
      } else {
        console.log('AppBlockerModule 메서드:', Object.keys(AppBlockerModule));
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
    if (Platform.OS === 'android') {
      // 필요한 권한이 모두 있는지 확인
      if (!hasAccessibilityPermission || !hasOverlayPermission) {
        // 권한이 없는 경우 안내창 표시
        Alert.alert(
          '권한 필요',
          '집중 모드에서 앱 제한 기능을 사용하려면 접근성 서비스와 화면 오버레이 권한이 필요합니다.',
          [
            { 
              text: '취소', 
              style: 'cancel',
              onPress: () => navigation.navigate('FocusMode') // 권한 부여 없이 그냥 포커스 모드로 이동
            },
            { 
              text: '권한 설정', 
              onPress: () => requestAppBlockerPermissions()
            }
          ]
        );
        return;
      }
      
      try {
        // 모든 권한이 있으면 앱 차단 활성화
        await AppBlockerModule.setAppBlockingEnabled(true);
        console.log('앱 차단 기능 활성화 성공');
      } catch (error) {
        console.error('앱 차단 기능 활성화 실패:', error);
      }
    }
    
    // 포커스 모드 화면으로 이동
    navigation.navigate('FocusMode');
  };
  
  // 앱 차단에 필요한 권한 요청
  const requestAppBlockerPermissions = async () => {
    try {
      if (!hasAccessibilityPermission) {
        // 디버깅을 위한 콘솔 로그 추가
        console.log('접근성 서비스 설정 화면으로 이동 시도');
        
        // 접근성 서비스 권한 설정 화면으로 이동
        await AppBlockerModule.openAccessibilitySettings();
        console.log('접근성 서비스 설정 화면으로 이동 완료');
      } else if (!hasOverlayPermission) {
        // 디버깅을 위한 콘솔 로그 추가
        console.log('화면 오버레이 권한 설정 화면으로 이동 시도');
        
        // 화면 오버레이 권한 설정 화면으로 이동
        await AppBlockerModule.openOverlaySettings();
        console.log('화면 오버레이 권한 설정 화면으로 이동 완료');
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
              <Text style={styles.walletWorkToken}>
                {isWalletConnected ? `${tokenBalance} ` : '연결 필요 '}
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