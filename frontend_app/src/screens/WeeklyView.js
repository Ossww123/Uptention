import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import ScreenTime from "../utils/ScreenTime"; // 경로는 실제 프로젝트 구조에 맞게 조정해주세요

const { width } = Dimensions.get("window");

const WeeklyView = () => {
  // 로딩 상태
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState({});
  const [appUsage, setAppUsage] = useState({});
  const [currentWeek, setCurrentWeek] = useState({
    start: "3월 15일",
    end: "3월 21일"
  });
  
  // 더미 데이터: 주간 채굴 데이터
  const weeklyMiningData = [
    { day: "15", value: 20, dayOfWeek: "월" },
    { day: "16", value: 15, dayOfWeek: "화" },
    { day: "17", value: 30, dayOfWeek: "수" },
    { day: "18", value: 22, dayOfWeek: "목" },
    { day: "19", value: 30, dayOfWeek: "금" },
    { day: "20", value: 25, dayOfWeek: "토" },
    { day: "21", value: 28, dayOfWeek: "일" },
  ];

  // 더미 데이터: 주간 총 채굴 시간
  const weeklyTotalMiningTime = {
    total: "38시간 17분",
    increase: "5시간 21분",
    average: "7시간 24분",
    averageStartTime: "오전 8:42",
    averageEndTime: "오후 5:52"
  };

  useEffect(() => {
    fetchWeeklyData();
  }, []);

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      
      // 주간 스크린 타임 데이터 가져오기
      const weeklyScreenTimeData = await ScreenTime.getWeeklyScreenTime();
      
      // 일일 데이터를 가져와서 앱 사용 정보도 표시
      const dailyData = await ScreenTime.getDailyScreenTime();
      
      if (dailyData.hasPermission) {
        setAppUsage(dailyData.appUsageWithNames || {});
      }
      
      // TODO: 실제 데이터 처리
      console.log("Weekly screen time data:", weeklyScreenTimeData);
      
      // 더미 데이터로 상태 설정 (실제 구현 시 API 데이터로 대체)
      setWeeklyData({
        miningData: weeklyMiningData,
        totalMiningTime: weeklyTotalMiningTime
      });
      
      setLoading(false);
    } catch (error) {
      console.error("주간 데이터 가져오기 오류:", error);
      setLoading(false);
    }
  };

  // 이전/다음 주 이동 처리
  const navigateWeek = (direction) => {
    // 실제 구현 시 날짜 계산 로직 추가
    console.log(`Navigate to ${direction} week`);
    
    // 더미 데이터로 상태 변경 예시
    if (direction === 'prev') {
      setCurrentWeek({
        start: "3월 8일",
        end: "3월 14일"
      });
    } else if (direction === 'next') {
      setCurrentWeek({
        start: "3월 22일",
        end: "3월 28일"
      });
    }
  };

  // 앱 사용 시간 바 너비 계산
  const getBarWidth = (usageTime) => {
    // 앱 중 최대 사용 시간 찾기
    const maxTime = Math.max(
      ...Object.values(appUsage).map((data) => data.usageTime)
    );
    
    // 최대 너비의 70%까지만 사용
    const maxWidth = width * 0.7;
    return (usageTime / maxTime) * maxWidth;
  };

  // 주간 채굴량 차트 바 렌더링
  const renderMiningBars = () => {
    const maxValue = Math.max(...weeklyMiningData.map(d => d.value));
    
    return weeklyMiningData.map((item, index) => {
      const isToday = item.day === "20"; // 오늘이 20일이라고 가정
      const barHeight = (item.value / maxValue) * 100;
      
      return (
        <View key={index} style={styles.barContainer}>
          <View style={styles.barWrapper}>
            <View 
              style={[
                styles.bar, 
                { height: `${barHeight}%` },
                styles.activeBar
              ]} 
            />
          </View>
          <Text style={styles.barText}>
            {item.day}
          </Text>
        </View>
      );
    });
  };

  // 앱 아이콘 렌더링 함수
  const renderAppIcon = (data) => {
    if (data.iconBase64) {
      // 앱 아이콘이 있는 경우 Base64로 인코딩된 이미지 렌더링
      return (
        <Image 
          source={{ uri: `data:image/png;base64,${data.iconBase64}` }}
          style={styles.appIcon}
          resizeMode="contain"
        />
      );
    } else {
      // 앱 아이콘이 없는 경우 기본 이미지 사용
      return (
        <Image 
          source={require('../../assets/chrome-icon.png')}
          style={styles.appIcon}
          resizeMode="contain"
        />
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 주간 채굴 차트 */}
      <View style={styles.chartContainer}>
        <View style={styles.weekNavigator}>
          <TouchableOpacity onPress={() => navigateWeek('prev')}>
            <Ionicons name="chevron-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.dateTitle}>{`${currentWeek.start} - ${currentWeek.end}`}</Text>
          <TouchableOpacity onPress={() => navigateWeek('next')}>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.chartContent}>
          <View style={styles.barsContainer}>
            {renderMiningBars()}
          </View>
          <Text style={styles.minutesLabel}>30분</Text>
          <View style={styles.chartDivider} />
          <Text style={styles.updateTimeText}>18:50에 업데이트됨</Text>
        </View>
      </View>

      {/* 채굴 시간 */}
      <View style={styles.miningTimeContainer}>
        <View style={styles.miningTimeHeader}>
          <Text style={styles.miningTimeTitle}>채굴 시간</Text>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </View>
        
        <Text style={styles.increasedTimeText}>
          전 주보다 {weeklyTotalMiningTime.increase} 증가했어요!
        </Text>
        
        <View style={styles.miningTimeContent}>
          <View style={styles.pickaxeContainer}>
            <Image 
              source={require('../../assets/pickaxe.png')} 
              style={styles.pickaxeIcon}
              resizeMode="contain"
            />
          </View>
          <View style={styles.miningTimeInfo}>
            <Text style={styles.miningTimeValue}>
              <Text style={styles.weeklyText}>총</Text> <Text style={styles.hoursText}>38</Text>시간
              <Text style={styles.minutesText}>17</Text>분
            </Text>
          </View>
        </View>
        
        <View style={styles.averageMiningContainer}>
          <Text style={styles.averageTitle}>평균 채굴 시간 {weeklyTotalMiningTime.average}</Text>
          
          <View style={styles.averageTimeRow}>
            <View style={styles.averageTimeItem}>
              <Ionicons name="time-outline" size={18} color="#666" />
              <Text style={styles.averageTimeLabel}>평균 시작 시간</Text>
              <Text style={styles.averageTimeValue}>{weeklyTotalMiningTime.averageStartTime}</Text>
            </View>
            
            <View style={styles.timelineSeparator} />
            
            <View style={styles.averageTimeItem}>
              <Ionicons name="time-outline" size={18} color="#666" />
              <Text style={styles.averageTimeLabel}>평균 종료 시간</Text>
              <Text style={styles.averageTimeValue}>{weeklyTotalMiningTime.averageEndTime}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 가장 많이 사용한 앱 */}
      <View style={styles.appUsageContainer}>
        <View style={styles.appUsageHeader}>
          <Text style={styles.appUsageTitle}>가장 많이 사용한 앱</Text>
          <TouchableOpacity>
            <Text style={styles.seeMoreText}>자세히 보기</Text>
          </TouchableOpacity>
        </View>

        {Object.entries(appUsage)
          .sort(([, dataA], [, dataB]) => dataB.usageTime - dataA.usageTime)
          .slice(0, 3) // 상위 3개 앱만 표시
          .map(([packageName, data], index) => {
            const hours = Math.floor(data.usageTime / 60);
            const minutes = Math.floor(data.usageTime % 60);
            
            return (
              <View key={packageName} style={styles.appItem}>
                <View style={styles.appInfoContainer}>
                  {renderAppIcon(data)}
                  <Text style={styles.appName}>{data.appName}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#888" />
                </View>
                <Text style={styles.appTimeText}>
                  {hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`}
                </Text>
                <View style={styles.appUsageBarContainer}>
                  <View 
                    style={[
                      styles.appUsageBar, 
                      { width: getBarWidth(data.usageTime) }
                    ]} 
                  />
                  <View style={styles.appUsageBarBg} />
                </View>
              </View>
            );
          })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666666",
  },
  scrollContainer: {
    flex: 1,
  },
  chartContainer: {
    margin: 20,
    marginTop: 0,
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 15,
  },
  weekNavigator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  dateTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
  },
  chartContent: {
    paddingBottom: 5,
    position: "relative",
  },
  barsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 150,
    marginBottom: 10,
  },
  barContainer: {
    alignItems: "center",
    width: 30,
  },
  barWrapper: {
    height: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    width: 16,
    borderRadius: 8,
    minHeight: 10,
  },
  activeBar: {
    backgroundColor: "#FF8C00",
  },
  inactiveBar: {
    backgroundColor: "#D0D0D0",
  },
  barText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
  minutesLabel: {
    position: "absolute",
    top: 10,
    right: 0,
    fontSize: 12,
    color: "#888",
  },
  chartDivider: {
    height: 1,
    backgroundColor: "#DDD",
    marginTop: 5,
  },
  updateTimeText: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 5,
  },
  miningTimeContainer: {
    margin: 20,
    marginTop: 0,
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 15,
  },
  miningTimeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  miningTimeTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  increasedTimeText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 15,
  },
  miningTimeContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  pickaxeContainer: {
    marginRight: 15,
  },
  pickaxeIcon: {
    width: 40,
    height: 40,
    transform: [{ rotate: "-30deg" }],
  },
  miningTimeInfo: {
    flex: 1,
  },
  miningTimeValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  weeklyText: {
    fontSize: 16,
    fontWeight: "500",
  },
  hoursText: {
    fontSize: 30,
    fontWeight: "bold",
  },
  minutesText: {
    fontSize: 30,
    fontWeight: "bold",
  },
  averageMiningContainer: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginTop: 5,
  },
  averageTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 15,
    textAlign: "center",
  },
  averageTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  averageTimeItem: {
    flex: 1,
    alignItems: "center",
  },
  timelineSeparator: {
    width: 1,
    height: 40,
    backgroundColor: "#DDD",
    marginHorizontal: 10,
  },
  averageTimeLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
    marginBottom: 4,
  },
  averageTimeValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  appUsageContainer: {
    margin: 20,
    marginTop: 0,
    marginBottom: 100, // 하단 여백
  },
  appUsageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  appUsageTitle: {
    fontSize: 18,
    fontWeight: "500",
  },
  seeMoreText: {
    fontSize: 14,
    color: "#0066CC",
  },
  appItem: {
    marginBottom: 20,
  },
  appInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  appIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  appName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  appTimeText: {
    fontSize: 14,
    marginBottom: 5,
    alignSelf: "flex-end",
  },
  appUsageBarContainer: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
  },
  appUsageBar: {
    height: "100%",
    backgroundColor: "#FF8C00",
    borderRadius: 6,
    position: "absolute",
    left: 0,
    top: 0,
  },
  appUsageBarBg: {
    position: "absolute",
    right: 0,
    top: 0,
    height: "100%",
    left: 0,
    backgroundColor: "#EEEEEE",
    borderRadius: 6,
    zIndex: -1,
  },
});

export default WeeklyView;