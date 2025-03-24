// DailyView.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import ScreenTime from "../utils/ScreenTime";

const { width } = Dimensions.get("window");

const DailyView = () => {
  const [dailyScreenTime, setDailyScreenTime] = useState(0);
  const [appUsage, setAppUsage] = useState({});
  
  // 현재 날짜 정보
  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const dayOfWeek = days[today.getDay()];

  // 더미 데이터: 일간 채굴 데이터 (7일)
  const weeklyMiningData = [
    { day: 14, value: 15 },
    { day: 15, value: 15 },
    { day: 16, value: 10 },
    { day: 17, value: 25 },
    { day: 18, value: 15 },
    { day: 19, value: 25 },
    { day: 20, value: 30 }, // 오늘
  ];

  useEffect(() => {
    fetchScreenTimeData();
  }, []);

  const fetchScreenTimeData = async () => {
    try {
      // 일일 스크린 타임 데이터 가져오기
      const dailyData = await ScreenTime.getDailyScreenTime();

      if (dailyData.hasPermission) {
        setDailyScreenTime(dailyData.totalScreenTimeMinutes);
        
        // 수정된 부분: 앱 이름이 포함된 appUsageWithNames 사용
        setAppUsage(dailyData.appUsageWithNames || {});
      }
    } catch (error) {
      console.error("스크린 타임 데이터 가져오기 오류:", error);
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

  // 일별 채굴량 차트 바 렌더링
  const renderMiningBars = () => {
    const maxValue = Math.max(...weeklyMiningData.map(d => d.value));
    
    return weeklyMiningData.map((item, index) => {
      const isToday = item.day === date;
      const barHeight = (item.value / maxValue) * 100;
      
      return (
        <View key={index} style={styles.barContainer}>
          <View style={styles.barWrapper}>
            <View 
              style={[
                styles.bar, 
                { height: `${barHeight}%` },
                isToday ? styles.activeBar : styles.inactiveBar
              ]} 
            />
          </View>
          <Text style={[styles.barText, isToday && styles.activeBarText]}>
            {isToday ? `3/${item.day}` : item.day}
          </Text>
        </View>
      );
    });
  };

  return (
    <ScrollView 
      style={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 일별 채굴 차트 */}
      <View style={styles.chartContainer}>
        <Text style={styles.dateTitle}>{`${month}월 ${date}일 ${dayOfWeek}`}</Text>
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
              <Text style={styles.hoursText}>8</Text>시간
              <Text style={styles.minutesText}>24</Text>분
            </Text>
            <Text style={styles.miningTimeRange}>오전 9:00 - 오후 5:45</Text>
          </View>
        </View>

        {/* 캐릭터와 메시지 */}
        <View style={styles.characterContainer}>
          <Image 
            source={require('../../assets/coin-character.png')} 
            style={styles.characterImage}
            resizeMode="contain"
          />
          <View style={styles.characterBubble}>
            <Text style={styles.characterText}>대단한데?</Text>
            <Text style={styles.characterText}>어제보다 37분 더 채굴했어!!</Text>
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
                  <Image 
                    source={require('../../assets/chrome-icon.png')} 
                    style={styles.appIcon}
                    resizeMode="contain"
                  />
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
  dateTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 20,
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
    color: "#888",
  },
  activeBarText: {
    color: "#FF8C00",
    fontWeight: "500",
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
    marginBottom: 15,
  },
  miningTimeTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  miningTimeContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
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
  hoursText: {
    fontSize: 30,
    fontWeight: "bold",
  },
  minutesText: {
    fontSize: 30,
    fontWeight: "bold",
  },
  miningTimeRange: {
    fontSize: 14,
    color: "#888",
    marginTop: 5,
  },
  characterContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 10,
    marginTop: 5,
  },
  characterImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  characterBubble: {
    flex: 1,
  },
  characterText: {
    fontSize: 14,
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

export default DailyView;