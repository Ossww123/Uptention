// DailyView.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import ScreenTime from "../utils/ScreenTime";

const { width } = Dimensions.get("window");

const DailyView = () => {
  const [dailyScreenTime, setDailyScreenTime] = useState(0);
  const [appUsage, setAppUsage] = useState({});
  const [loading, setLoading] = useState(true);
  
  // 현재 선택된 날짜 (기본값은 오늘)
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // 선택된 날짜의 데이터
  const [selectedDayData, setSelectedDayData] = useState(null);
  
  // 그래프 스크롤 참조
  const graphScrollRef = useRef(null);

  // 더미 데이터: 지난 14일간의 채굴 데이터
  const generateMiningData = () => {
    const today = new Date();
    const data = [];
    
    // 14일 전부터 오늘까지의 데이터 생성
    for (let i = 14; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const value = Math.floor(Math.random() * 30) + 5; // 5-35분 사이 랜덤값
      
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      const dayOfWeek = days[date.getDay()];
      
      // 채굴 시간 더미 데이터 (시간, 분)
      const hours = Math.floor(Math.random() * 8) + 1; // 1-8시간
      const minutes = Math.floor(Math.random() * 60); // 0-59분
      
      // 시작 시간 (오전 8-10시 사이)
      const startHour = Math.floor(Math.random() * 3) + 8;
      const startMinute = Math.floor(Math.random() * 60);
      
      // 종료 시간 (시작 시간 + 채굴 시간)
      const endTime = new Date();
      endTime.setHours(startHour);
      endTime.setMinutes(startMinute);
      endTime.setHours(endTime.getHours() + hours);
      endTime.setMinutes(endTime.getMinutes() + minutes);
      
      // 종료 시간 포맷팅
      const endHour = endTime.getHours();
      const endMinute = endTime.getMinutes();
      
      data.push({
        id: `${month}-${day}`,
        day: day,
        month: month,
        value: value,
        dayOfWeek: dayOfWeek,
        isToday: i === 0,
        miningTime: {
          hours: hours,
          minutes: minutes,
          startTime: `오전 ${startHour}:${startMinute.toString().padStart(2, '0')}`,
          endTime: `오${endHour >= 12 ? '후' : '전'} ${endHour > 12 ? endHour - 12 : endHour}:${endMinute.toString().padStart(2, '0')}`
        }
      });
    }
    
    return data;
  };
  
  const [miningData, setMiningData] = useState(generateMiningData());

  useEffect(() => {
    fetchScreenTimeData();
    // 초기 선택은 오늘 날짜 데이터
    const todayData = miningData.find(item => item.isToday);
    setSelectedDayData(todayData);
    setLoading(false);
  }, []);

  const fetchScreenTimeData = async () => {
    try {
      // 일일 스크린 타임 데이터 가져오기
      const dailyData = await ScreenTime.getDailyScreenTime();

      if (dailyData.hasPermission) {
        setDailyScreenTime(dailyData.totalScreenTimeMinutes);
        // 앱 이름과 아이콘이 포함된 appUsageWithNames 사용
        setAppUsage(dailyData.appUsageWithNames || {});
      }
    } catch (error) {
      console.error("스크린 타임 데이터 가져오기 오류:", error);
    }
  };

  // 특정 날짜 선택 처리
  const handleSelectDay = (item) => {
    setSelectedDayData(item);
    setSelectedDate(new Date(2025, item.month - 1, item.day));
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

  // 날짜 막대 그래프 렌더링
  const renderMiningBar = ({ item }) => {
    const maxValue = Math.max(...miningData.map(d => d.value));
    const barHeight = (item.value / maxValue) * 100;
    const isSelected = selectedDayData && selectedDayData.id === item.id;
    
    return (
      <TouchableOpacity 
        style={styles.barContainer}
        onPress={() => handleSelectDay(item)}
      >
        <View style={styles.barWrapper}>
          <View 
            style={[
              styles.bar, 
              { height: `${barHeight}%` },
              item.isToday ? styles.activeBar : styles.inactiveBar,
              isSelected && !item.isToday && styles.selectedBar
            ]} 
          />
        </View>
        <Text style={[
          styles.barText, 
          item.isToday && styles.activeBarText,
          isSelected && !item.isToday && styles.selectedBarText
        ]}>
          {item.day}
        </Text>
        <Text style={[
          styles.barDayOfWeek,
          item.isToday && styles.activeBarText,
          isSelected && !item.isToday && styles.selectedBarText
        ]}>
          {item.dayOfWeek}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
      {/* 일별 채굴 차트 */}
      <View style={styles.chartContainer}>
        <Text style={styles.dateTitle}>
          {`${selectedDayData.month}월 ${selectedDayData.day}일 ${selectedDayData.dayOfWeek}요일`}
        </Text>
        <View style={styles.chartContent}>
          {/* 수평 스크롤 가능한 그래프 */}
          <FlatList
            ref={graphScrollRef}
            data={miningData}
            renderItem={renderMiningBar}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.barsContainer}
            initialScrollIndex={miningData.length - 7} // 최근 7일이 보이도록 초기 스크롤 위치 설정
            getItemLayout={(data, index) => ({
              length: 45, // 각 아이템의 너비
              offset: 45 * index,
              index,
            })}
            onLayout={() => {
              // 컴포넌트가 렌더링된 후 마지막 위치로 스크롤
              graphScrollRef.current?.scrollToIndex({
                index: miningData.length - 7,
                animated: false,
              });
            }}
          />
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
              <Text style={styles.hoursText}>{selectedDayData.miningTime.hours}</Text>시간
              <Text style={styles.minutesText}>{selectedDayData.miningTime.minutes}</Text>분
            </Text>
            <Text style={styles.miningTimeRange}>
              {selectedDayData.miningTime.startTime} - {selectedDayData.miningTime.endTime}
            </Text>
          </View>
        </View>

        {selectedDayData.isToday && (
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
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
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
  dateTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 20,
  },
  chartContent: {
    paddingBottom: 5,
    position: "relative",
    height: 200, // 그래프 높이 조정
  },
  barsContainer: {
    height: 150,
    alignItems: "flex-end",
    paddingRight: 10,
  },
  barContainer: {
    alignItems: "center",
    width: 45, // 각 막대 컨테이너 너비
    marginHorizontal: 2,
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
  selectedBar: {
    backgroundColor: "#FFA54F", // 선택된 막대 색상
  },
  barText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
  barDayOfWeek: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  activeBarText: {
    color: "#FF8C00",
    fontWeight: "500",
  },
  selectedBarText: {
    color: "#FFA54F",
    fontWeight: "500",
  },
  minutesLabel: {
    position: "absolute",
    top: 10,
    right: 10,
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