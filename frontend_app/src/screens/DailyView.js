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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenTime from "../utils/ScreenTime";
import { get } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import MiningGraph from "../components/MiningGraph"; // 새로운 공통 컴포넌트 임포트

const { width } = Dimensions.get("window");

const DailyView = () => {
  const { userId } = useAuth(); // AuthContext에서 userId 가져오기
  const [dailyScreenTime, setDailyScreenTime] = useState(0);
  const [appUsage, setAppUsage] = useState({});
  const [loading, setLoading] = useState(true);

  // 현재 선택된 날짜 (기본값은 오늘)
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 선택된 날짜의 데이터
  const [selectedDayData, setSelectedDayData] = useState(null);
  
  // 전날 대비 채굴 시간 차이
  const [miningDifference, setMiningDifference] = useState(0);

  // 그래프 스크롤 참조
  const graphScrollRef = useRef(null);

  // 채굴 데이터 상태
  const [miningData, setMiningData] = useState([]);

  useEffect(() => {
    fetchMiningData();
    fetchScreenTimeData();
  }, []);

  // API에서 채굴 데이터 가져오기
  const fetchMiningData = async () => {
    try {
      setLoading(true);

      // 날짜 범위 계산 (오늘 포함 지난 14일)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 14);

      // 날짜를 'yyyy-MM-ddThh:mm:ss' 형식으로 변환
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };

      // 형식화된 날짜 문자열로 변환
      const startTime = formatDate(startDate);
      const endTime = formatDate(endDate);

      // API 호출
      const response = await get(
        `/users/${userId}/mining-times?startTime=${startTime}&endTime=${endTime}`
      );

      if (response.ok) {
        const apiData = response.data;

        // 날짜 범위에 대한 전체 데이터 배열 생성 (데이터가 없는 날짜는 0으로 설정)
        const miningDataArray = [];
        const days = ["일", "월", "화", "수", "목", "금", "토"];

        for (let i = 14; i >= 0; i--) {
          const date = new Date();
          date.setDate(endDate.getDate() - i);

          const day = date.getDate();
          const month = date.getMonth() + 1;
          const dayOfWeek = days[date.getDay()];
          const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD 형식

          // API 응답에서 해당 날짜의 데이터 찾기
          const dayData = apiData.find((item) => item.date === formattedDate);
          const totalTime = dayData ? dayData.totalTime : 0; // 데이터가 없으면 0

          // 시간과 분 계산
          const hours = Math.floor(totalTime / 60);
          const minutes = totalTime % 60;

          miningDataArray.push({
            id: `${month}-${day}`,
            day: day,
            month: month,
            value: totalTime > 0 ? totalTime : 5, // 데이터가 0이면 최소값 5로 설정
            dayOfWeek: dayOfWeek,
            isToday: i === 0,
            miningTime: {
              hours: hours,
              minutes: minutes,
              totalMinutes: totalTime
            },
          });
        }

        setMiningData(miningDataArray);

        // 오늘 데이터를 기본 선택으로 설정
        const todayData = miningDataArray.find((item) => item.isToday);
        setSelectedDayData(todayData);
        
        // 오늘과 어제의 채굴 시간 차이 계산
        if (miningDataArray.length >= 2) {
          const todayIndex = miningDataArray.findIndex(item => item.isToday);
          if (todayIndex >= 1) { // 어제 데이터가 있는지 확인
            const today = miningDataArray[todayIndex].miningTime.totalMinutes;
            const yesterday = miningDataArray[todayIndex - 1].miningTime.totalMinutes;
            setMiningDifference(today - yesterday);
          }
        }
      } else {
        console.error("채굴 시간 데이터 가져오기 실패:", response.data);

        // API 오류 시 기본 더미 데이터 생성 (개발 중 테스트용)
        const dummyData = generateDummyMiningData();
        setMiningData(dummyData);

        const todayData = dummyData.find((item) => item.isToday);
        setSelectedDayData(todayData);
        
        // 더미 데이터로 채굴 시간 차이 계산
        if (dummyData.length >= 2) {
          const todayIndex = dummyData.findIndex(item => item.isToday);
          if (todayIndex >= 1) {
            const today = dummyData[todayIndex].miningTime.totalMinutes;
            const yesterday = dummyData[todayIndex - 1].miningTime.totalMinutes;
            setMiningDifference(today - yesterday);
          }
        }
      }
    } catch (error) {
      console.error("채굴 시간 데이터 가져오기 오류:", error);

      // 오류 발생 시 기본 더미 데이터 생성
      const dummyData = generateDummyMiningData();
      setMiningData(dummyData);

      const todayData = dummyData.find((item) => item.isToday);
      setSelectedDayData(todayData);
      
      // 더미 데이터로 채굴 시간 차이 계산
      if (dummyData.length >= 2) {
        const todayIndex = dummyData.findIndex(item => item.isToday);
        if (todayIndex >= 1) {
          const today = dummyData[todayIndex].miningTime.totalMinutes;
          const yesterday = dummyData[todayIndex - 1].miningTime.totalMinutes;
          setMiningDifference(today - yesterday);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // 백업용 더미 데이터 생성 함수 (API 오류 시 사용)
  const generateDummyMiningData = () => {
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
      const totalMinutes = hours * 60 + minutes;

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
          totalMinutes: totalMinutes
        },
      });
    }

    return data;
  };

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
  const handleSelectDay = async (item) => {
    setSelectedDayData(item);

    // 선택한 날짜 객체 생성
    const selectedDateObj = new Date(2025, item.month - 1, item.day);
    setSelectedDate(selectedDateObj);
    
    // 선택된 날짜와 전날의 채굴 시간 차이 계산
    const selectedIndex = miningData.findIndex(data => data.id === item.id);
    if (selectedIndex > 0) { // 선택된 날짜 이전 데이터가 있는지 확인
      const selectedTime = miningData[selectedIndex].miningTime.totalMinutes;
      const prevDayTime = miningData[selectedIndex - 1].miningTime.totalMinutes;
      setMiningDifference(selectedTime - prevDayTime);
    } else {
      setMiningDifference(0); // 이전 날짜가 없으면 차이를 0으로 설정
    }

    try {
      // 선택한 날짜의 스크린타임 데이터 가져오기
      const screenTimeData = await ScreenTime.getScreenTimeByDate(
        selectedDateObj
      );

      if (screenTimeData.hasPermission) {
        setDailyScreenTime(screenTimeData.totalScreenTimeMinutes);
        // 앱 이름과 아이콘이 포함된 appUsageWithNames 사용
        setAppUsage(screenTimeData.appUsageWithNames || {});
      }
    } catch (error) {
      console.error(
        `${item.month}월 ${item.day}일 데이터 가져오기 오류:`,
        error
      );
      // 오류 발생 시 빈 데이터 설정
      setAppUsage({});
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

  // 시간 차이를 분 또는 시간+분 형식으로 표시
  const formatTimeDifference = (minutes) => {
    const absMinutes = Math.abs(minutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;
    
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    } else {
      return `${mins}분`;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
      </View>
    );
  }

  // 데이트 타이틀 포맷팅
  const dateTitle = selectedDayData 
    ? `${selectedDayData.month}월 ${selectedDayData.day}일 ${selectedDayData.dayOfWeek}요일`
    : "";

  return (
    <ScrollView
      style={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 공통 그래프 컴포넌트 사용 */}
      <MiningGraph
        data={miningData}
        isScrollable={true}
        selectedItem={selectedDayData}
        onSelectBar={handleSelectDay}
        dateRangeTitle={dateTitle}
      />

      {/* 채굴 시간 */}
      <View style={styles.miningTimeContainer}>
        <View style={styles.miningTimeHeader}>
          <Text style={styles.miningTimeTitle}>채굴 시간</Text>
        </View>

        <View style={styles.miningTimeContent}>
          <View style={styles.pickaxeContainer}>
            <Image
              source={require("../../assets/pickaxe.png")}
              style={styles.pickaxeIcon}
              resizeMode="contain"
            />
          </View>
          <View style={styles.miningTimeInfo}>
            <Text style={[styles.miningTimeValue, styles.rightAlignedText]}>
              <Text style={styles.hoursText}>
                {selectedDayData.miningTime.hours}
              </Text>
              시간 
              <Text style={styles.minutesText}>
                {selectedDayData.miningTime.minutes}
              </Text>
              분
            </Text>
          </View>
        </View>

        {selectedDayData.isToday && miningDifference !== 0 && (
          <View style={styles.characterContainer}>
            <Image
              source={require("../../assets/coin-character.png")}
              style={styles.characterImage}
              resizeMode="contain"
            />
            <View style={styles.characterBubble}>
              <Text style={styles.characterText}>
                {miningDifference > 0 ? "대단한데?" : "힘내!"}
              </Text>
              <Text style={styles.characterText}>
                어제보다 {formatTimeDifference(miningDifference)} {miningDifference > 0 ? "더" : "적게"} 채굴했어!!
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 가장 많이 사용한 앱 */}
      <View style={styles.appUsageContainer}>
        <View style={styles.appUsageHeader}>
          <Text style={styles.appUsageTitle}>가장 많이 사용한 앱</Text>
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
          
        {/* 시간대 정보 */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666666",
  },
  scrollContainer: {
    flex: 1,
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
  timezoneContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  timezoneText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
  rightAlignedText: {
    textAlign: 'right',
  },
});

export default DailyView;