// WeeklyView.js
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
import { Ionicons } from "@expo/vector-icons";
import ScreenTime from "../utils/ScreenTime";
import { get } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const { width } = Dimensions.get("window");

const WeeklyView = () => {
  const { userId } = useAuth(); // AuthContext에서 userId 가져오기

  // 로딩 상태
  const [loading, setLoading] = useState(true);
  const [appUsage, setAppUsage] = useState({});

  // 주간 채굴 데이터
  const [weeklyMiningData, setWeeklyMiningData] = useState([]);

  // 주간 총 채굴 시간 정보
  const [weeklyTotalMiningTime, setWeeklyTotalMiningTime] = useState({
    total: "0시간 0분",
    increase: "0시간 0분",
    average: "0시간 0분",
    averageStartTime: "오전 9:00",
    averageEndTime: "오후 6:00",
  });

  // 현재 선택된 주 상태
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0); // 0: 이번주, 1: 저번주
  const [currentWeek, setCurrentWeek] = useState({
    start: "",
    end: "",
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    // 컴포넌트 마운트 시 초기 날짜 범위 설정
    setInitialDateRange();
  }, []);

  // 각 주의 시작일과 종료일을 계산
  useEffect(() => {
    if (currentWeek.startDate && currentWeek.endDate) {
      fetchWeeklyData();
    }
  }, [currentWeek]);

  // 초기 날짜 범위 설정 함수 - 오늘부터 7일 전까지
  const setInitialDateRange = () => {
    const today = new Date();
    const endDate = new Date(today);

    // 시작일은 오늘로부터 6일 전
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);

    // 날짜 범위 설정
    setCurrentWeekRange(startDate, endDate);
  };

  // 주간 날짜 범위 설정 함수
  const setCurrentWeekRange = (startDate, endDate) => {
    // 날짜 포맷팅 함수
    const formatDateString = (date) => {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}월 ${day}일`;
    };

    setCurrentWeek({
      start: formatDateString(startDate),
      end: formatDateString(endDate),
      startDate: startDate,
      endDate: endDate,
    });
  };

  // 날짜를 'yyyy-MM-ddThh:mm:ss' 형식으로 변환
  const formatDateForApi = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  // 주간 데이터 가져오기
  const fetchWeeklyData = async () => {
    try {
      setLoading(true);

      // API에 전달할 시작/종료 날짜 포맷팅
      const startTime = formatDateForApi(currentWeek.startDate);
      const endTime = formatDateForApi(currentWeek.endDate);

      // API 호출
      const response = await get(
        `/users/${userId}/mining-times?startTime=${startTime}&endTime=${endTime}`
      );

      if (response.ok) {
        const apiData = response.data;

        // 이 주의 각 날짜에 대한 데이터 매핑
        const miningDataArray = [];
        const days = ["일", "월", "화", "수", "목", "금", "토"];

        let totalMinutes = 0;

        // 시작일부터 종료일까지 데이터 생성 (7일)
        for (let i = 0; i < 7; i++) {
          const date = new Date(currentWeek.startDate);
          date.setDate(currentWeek.startDate.getDate() + i);

          const day = date.getDate();
          const month = date.getMonth() + 1;
          const dayOfWeek = days[date.getDay()];
          const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD 형식

          // API 응답에서 해당 날짜의 데이터 찾기
          const dayData = apiData.find((item) => item.date === formattedDate);
          const value = dayData ? dayData.totalTime : 0;

          // 총 시간 누적
          totalMinutes += value;

          miningDataArray.push({
            day: day.toString(),
            month: month,
            value: value > 0 ? value : 5, // 최소값 5로 설정 (그래프 표시를 위해)
            dayOfWeek: dayOfWeek,
          });
        }

        setWeeklyMiningData(miningDataArray);

        // 주간 총 채굴 시간 정보 계산
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        // 일평균 시간
        const avgDailyMinutes = Math.round(totalMinutes / 7);
        const avgHours = Math.floor(avgDailyMinutes / 60);
        const avgMinutes = avgDailyMinutes % 60;

        // 증가량 계산 (임의 값)
        const increaseHours = Math.floor(Math.random() * 5);
        const increaseMinutes = Math.floor(Math.random() * 60);

        setWeeklyTotalMiningTime({
          total: `${hours}시간 ${minutes}분`,
          increase: `${increaseHours}시간 ${increaseMinutes}분`,
          average: `${avgHours}시간 ${avgMinutes}분`,
          averageStartTime: "오전 8:42", // 임의 값
          averageEndTime: "오후 5:52", // 임의 값
        });
      } else {
        console.error("주간 채굴 시간 데이터 가져오기 실패:", response.data);

        // 에러 시 더미 데이터 사용
        setDummyData();
      }

      // 앱 사용 정보 가져오기
      const dailyData = await ScreenTime.getDailyScreenTime();
      if (dailyData.hasPermission) {
        setAppUsage(dailyData.appUsageWithNames || {});
      }
    } catch (error) {
      console.error("주간 데이터 가져오기 오류:", error);
      // 에러 시 더미 데이터 사용
      setDummyData();
    } finally {
      setLoading(false);
    }
  };

  // 더미 데이터 설정 (API 오류 시)
  const setDummyData = () => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dummyMiningData = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeek.startDate);
      date.setDate(currentWeek.startDate.getDate() + i);

      const day = date.getDate();
      const month = date.getMonth() + 1;
      const dayOfWeek = days[date.getDay()];
      const value = Math.floor(Math.random() * 30) + 5; // 5-35 사이 랜덤값

      dummyMiningData.push({
        day: day.toString(),
        month: month,
        value: value,
        dayOfWeek: dayOfWeek,
      });
    }

    setWeeklyMiningData(dummyMiningData);

    // 더미 총 채굴 시간 정보
    setWeeklyTotalMiningTime({
      total: "38시간 17분",
      increase: "5시간 21분",
      average: "7시간 24분",
      averageStartTime: "오전 8:42",
      averageEndTime: "오후 5:52",
    });
  };

  // 이전/다음 주 이동 처리
  const navigateWeek = (direction) => {
    if (direction === "prev") {
      // 이전 7일로 이동
      const newEndDate = new Date(currentWeek.startDate);
      newEndDate.setDate(newEndDate.getDate() - 1); // 현재 시작일 하루 전

      const newStartDate = new Date(newEndDate);
      newStartDate.setDate(newEndDate.getDate() - 6); // 7일 전

      setCurrentWeekRange(newStartDate, newEndDate);
      setCurrentWeekIndex(currentWeekIndex + 1);
    } else if (direction === "next" && currentWeekIndex > 0) {
      // 다음 7일로 이동 (최신 주까지만)
      const newStartDate = new Date(currentWeek.endDate);
      newStartDate.setDate(newStartDate.getDate() + 1); // 현재 종료일 다음날

      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newStartDate.getDate() + 6); // 7일 후

      // 오늘 이후로는 설정 안함
      const today = new Date();
      if (newEndDate > today) {
        newEndDate.setTime(today.getTime());

        // 시작일 재조정 (endDate에서 6일 전)
        newStartDate.setTime(newEndDate.getTime());
        newStartDate.setDate(newEndDate.getDate() - 6);
      }

      setCurrentWeekRange(newStartDate, newEndDate);
      setCurrentWeekIndex(currentWeekIndex - 1);
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
    if (weeklyMiningData.length === 0) return null;

    // 최대값 계산 (8시간 = 480분 또는 최대값 중 큰 값)
    const MAX_MINING_TIME = 480;
    const maxDataValue = Math.max(...weeklyMiningData.map((d) => d.value));
    const maxValue = Math.max(maxDataValue, MAX_MINING_TIME);

    return weeklyMiningData.map((item, index) => {
      // 상대적 높이 계산
      const barHeight = (item.value / maxValue) * 100;

      return (
        <View key={index} style={styles.barContainer}>
          <View style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                { height: `${barHeight}%` },
                styles.activeBar,
              ]}
            />
          </View>
          <Text style={styles.barText}>{item.day}</Text>
          <Text style={styles.barDayOfWeek}>{item.dayOfWeek}</Text>
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
          source={require("../../assets/chrome-icon.png")}
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
          <TouchableOpacity onPress={() => navigateWeek("prev")}>
            <Ionicons name="chevron-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text
            style={styles.dateTitle}
          >{`${currentWeek.start} - ${currentWeek.end}`}</Text>
          <TouchableOpacity
            onPress={() => navigateWeek("next")}
            disabled={currentWeekIndex === 0}
            style={currentWeekIndex === 0 ? styles.disabledNavButton : {}}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={currentWeekIndex === 0 ? "#ccc" : "#666"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.chartContent}>
          <View style={styles.barsContainer}>{renderMiningBars()}</View>
          <Text style={styles.minutesLabel}>8시간</Text>
          <View style={styles.chartDivider} />
          <Text style={styles.updateTimeText}>
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            에 업데이트됨
          </Text>
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
              source={require("../../assets/pickaxe.png")}
              style={styles.pickaxeIcon}
              resizeMode="contain"
            />
          </View>
          <View style={styles.miningTimeInfo}>
            <Text style={styles.miningTimeValue}>
              <Text style={styles.weeklyText}>총</Text>{" "}
              <Text style={styles.hoursText}>
                {weeklyTotalMiningTime.total.split("시간")[0]}
              </Text>
              시간
              <Text style={styles.minutesText}>
                {weeklyTotalMiningTime.total.split("시간")[1].replace("분", "")}
              </Text>
              분
            </Text>
          </View>
        </View>

        <View style={styles.averageMiningContainer}>
          <Text style={styles.averageTitle}>
            평균 채굴 시간 {weeklyTotalMiningTime.average}
          </Text>

          <View style={styles.averageTimeRow}>
            <View style={styles.averageTimeItem}>
              <Ionicons name="time-outline" size={18} color="#666" />
              <Text style={styles.averageTimeLabel}>평균 시작 시간</Text>
              <Text style={styles.averageTimeValue}>
                {weeklyTotalMiningTime.averageStartTime}
              </Text>
            </View>

            <View style={styles.timelineSeparator} />

            <View style={styles.averageTimeItem}>
              <Ionicons name="time-outline" size={18} color="#666" />
              <Text style={styles.averageTimeLabel}>평균 종료 시간</Text>
              <Text style={styles.averageTimeValue}>
                {weeklyTotalMiningTime.averageEndTime}
              </Text>
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
                      { width: getBarWidth(data.usageTime) },
                    ]}
                  />
                  <View style={styles.appUsageBarBg} />
                </View>
              </View>
            );
          })}
        <View style={styles.timezoneContainer}>
          <Text style={styles.timezoneText}>
            채굴 시간은 한국 시간(UTC+9) 기준입니다.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // 기존 스타일 코드와 동일
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
    paddingTop: 30, // 상단에 "8시간" 라벨을 위한 공간 확보
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
    paddingTop: 25, // "8시간" 라벨 아래에서 시작하도록 조정
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
    marginTop: 10, // 8에서 10으로 증가
    fontSize: 14,
    color: "#666",
  },
  barDayOfWeek: {
    fontSize: 12,
    color: "#888",
    marginTop: 3,
  },
  minutesLabel: {
    position: "absolute",
    top: 5, // 상단에서 거리 조정
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
  disabledNavButton: {
    opacity: 0.5,
  },
  timezoneContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  timezoneText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});

export default WeeklyView;
