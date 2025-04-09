// WeeklyView.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import ScreenTime from "../utils/ScreenTime";
import { get } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import MiningGraph from "../components/MiningGraph"; // 공통 그래프 컴포넌트
import MiningStats from "../components/MiningStats"; // 공통 통계 컴포넌트
import AppUsageStats from "../components/AppUsageStats"; // 공통 앱 사용 컴포넌트

const WeeklyView = () => {
  const { userId } = useAuth(); // AuthContext에서 userId 가져오기

  // 로딩 상태
  const [loading, setLoading] = useState(true);
  const [appUsage, setAppUsage] = useState({});
  // 이전 주 앱 사용량 데이터 추가
  const [prevWeekAppUsage, setPrevWeekAppUsage] = useState({});

  // 주간 채굴 데이터
  const [weeklyMiningData, setWeeklyMiningData] = useState([]);

  // 주간 총 채굴 시간 정보 (객체 형태로 변경)
  const [weeklyTotalTime, setWeeklyTotalTime] = useState({
    hours: 0,
    minutes: 0,
    totalMinutes: 0,
  });

  // 주간 비교값 (전주 대비)
  const [weeklyComparison, setWeeklyComparison] = useState(0);

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

  // 날짜가 주어진 범위 내에 있는지 확인하는 함수
  const isDateInRange = (date, startDate, endDate) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return targetDate >= start && targetDate <= end;
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
          const value = dayData ? Math.min(dayData.totalTime, 480) : 0;

          // 총 시간 누적
          totalMinutes += value;

          // 오늘 날짜인지 확인
          const today = new Date();
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

          miningDataArray.push({
            id: `${month}-${day}`,
            day: day.toString(),
            month: month,
            value: value > 0 ? value : 5, // 최소값 5로 설정 (그래프 표시를 위해)
            dayOfWeek: dayOfWeek,
            isToday: isToday,
            miningTime: {
              hours: Math.floor(value / 60),
              minutes: value % 60,
              totalMinutes: value,
            },
          });
        }

        setWeeklyMiningData(miningDataArray);

        // 주간 총 채굴 시간 세팅 (객체 형태로)
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        setWeeklyTotalTime({
          hours: hours,
          minutes: minutes,
          totalMinutes: totalMinutes,
        });

        // 임의의 전주 대비 증감값 설정 (실제로는 API에서 제공하는 값을 사용)
        // 현재는 -300 ~ 300 사이의 임의 값 (분 단위)
        const randomComparisonValue = Math.floor(Math.random() * 600) - 300;
        setWeeklyComparison(randomComparisonValue);

        // 최근 14일간의 앱 사용 정보 가져오기
        const weeklyScreenTimeData = await ScreenTime.getWeeklyScreenTime(14);
        
        if (weeklyScreenTimeData.hasPermission) {
          const appUsageData = weeklyScreenTimeData.appUsageWithNames || {};
          
          // 현재 주와 이전 주의 날짜 범위 계산
          const currentWeekStart = new Date(currentWeek.startDate);
          const currentWeekEnd = new Date(currentWeek.endDate);
          
          const prevWeekEnd = new Date(currentWeekStart);
          prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
          
          const prevWeekStart = new Date(prevWeekEnd);
          prevWeekStart.setDate(prevWeekEnd.getDate() - 6);
          
          // 날짜별 사용 시간 데이터(dailyScreenTime)에서 현재 주와 이전 주 분리
          const currentWeekDates = {};
          const prevWeekDates = {};
          
          // ScreenTimeModule에서 제공하는 dailyScreenTime은 날짜별 전체 스크린 타임 매핑
          Object.entries(weeklyScreenTimeData.dailyScreenTime || {}).forEach(([dateStr, screenTime]) => {
            const date = new Date(dateStr);
            if (isDateInRange(date, currentWeekStart, currentWeekEnd)) {
              currentWeekDates[dateStr] = screenTime;
            } else if (isDateInRange(date, prevWeekStart, prevWeekEnd)) {
              prevWeekDates[dateStr] = screenTime;
            }
          });
          
          // 현재 주와 이전 주의 앱별 사용 시간 데이터 분리 처리
          const currentWeekAppUsage = {};
          const prevWeekAppUsage = {};
          
          // 앱별 사용 시간 데이터
          Object.entries(appUsageData).forEach(([packageName, appInfo]) => {
            // 현재 일별 데이터로는 앱별 일자별 사용 시간을 직접 알 수 없으므로,
            // 전체 앱 사용 시간 비율을 기반으로 근사치 계산
            
            // 현재 주와 이전 주의 총 스크린 타임 계산
            const currentWeekTotalScreenTime = Object.values(currentWeekDates).reduce((sum, time) => sum + time, 0);
            const prevWeekTotalScreenTime = Object.values(prevWeekDates).reduce((sum, time) => sum + time, 0);
            const totalScreenTime = currentWeekTotalScreenTime + prevWeekTotalScreenTime;
            
            if (totalScreenTime > 0) {
              // 앱의 총 사용 시간을 현재 주와 이전 주로 비율 기반 분배
              // (더 정확한 방법이 있다면 개선 가능)
              const currentWeekRatio = currentWeekTotalScreenTime / totalScreenTime;
              const prevWeekRatio = prevWeekTotalScreenTime / totalScreenTime;
              
              // 앱 정보 복사 및 사용 시간 계산
              currentWeekAppUsage[packageName] = {
                ...appInfo,
                usageTime: Math.round(appInfo.usageTime * currentWeekRatio)
              };
              
              prevWeekAppUsage[packageName] = {
                ...appInfo,
                usageTime: Math.round(appInfo.usageTime * prevWeekRatio)
              };
            }
          });
          
          // 현재 주가 첫 번째 주(최신 주)인 경우에만 현재 주/이전 주 데이터 업데이트
          if (currentWeekIndex === 0) {
            setAppUsage(currentWeekAppUsage);
            setPrevWeekAppUsage(prevWeekAppUsage);
          } else if (currentWeekIndex === 1) {
            // 현재 선택된 주가 이전 주인 경우, 이전 주 데이터를 현재 표시용으로 설정
            setAppUsage(prevWeekAppUsage);
            
            // 두 번째 이전 주 데이터는 여기서는 계산하지 않음
            // 필요시 추가 구현 가능
            setPrevWeekAppUsage({});
          }
        }
      } else {
        console.error("주간 채굴 시간 데이터 가져오기 실패:", response.data);

        // 에러 시 더미 데이터 사용
        setDummyData();
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
    let totalMinutes = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeek.startDate);
      date.setDate(currentWeek.startDate.getDate() + i);

      const day = date.getDate();
      const month = date.getMonth() + 1;
      const dayOfWeek = days[date.getDay()];

      // 랜덤 채굴 시간 생성 (분 단위)
      const value = Math.floor(Math.random() * 480) + 30; // 30-510분 사이 랜덤값
      totalMinutes += value;

      // 오늘 날짜인지 확인
      const today = new Date();
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      dummyMiningData.push({
        id: `${month}-${day}`,
        day: day.toString(),
        month: month,
        value: value,
        dayOfWeek: dayOfWeek,
        isToday: isToday,
        miningTime: {
          hours: Math.floor(value / 60),
          minutes: value % 60,
          totalMinutes: value,
        },
      });
    }

    setWeeklyMiningData(dummyMiningData);

    // 총 시간 계산
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // 주간 총 채굴 시간 세팅 (객체 형태로)
    setWeeklyTotalTime({
      hours: hours,
      minutes: minutes,
      totalMinutes: totalMinutes,
    });

    // 임의의 전주 대비 증감값 설정
    const randomComparisonValue = Math.floor(Math.random() * 600) - 300; // -300 ~ 300 사이의 임의 값 (분 단위)
    setWeeklyComparison(randomComparisonValue);

    // 더미 앱 사용 데이터 설정 - 현재 주
    const dummyAppUsage = {
      "com.google.android.youtube": {
        appName: "YouTube",
        usageTime: 185,
        iconBase64: null,
      },
      "com.kakao.talk": {
        appName: "카카오톡",
        usageTime: 120,
        iconBase64: null,
      },
      "com.instagram.android": {
        appName: "Instagram",
        usageTime: 90,
        iconBase64: null,
      },
    };
    
    // 더미 앱 사용 데이터 설정 - 이전 주 (현재와 약간 다른 값)
    const dummyPrevWeekAppUsage = {
      "com.google.android.youtube": {
        appName: "YouTube",
        usageTime: 155,
        iconBase64: null,
      },
      "com.kakao.talk": {
        appName: "카카오톡",
        usageTime: 140,
        iconBase64: null,
      },
      "com.instagram.android": {
        appName: "Instagram",
        usageTime: 70,
        iconBase64: null,
      },
    };
    
    setAppUsage(dummyAppUsage);
    setPrevWeekAppUsage(dummyPrevWeekAppUsage);
  };

  // 이전/다음 주 이동 처리
  const navigateWeek = (direction) => {
    if (direction === "prev") {
      // 이전 주로 이동할 때 최대 2주(14일) 전까지만 허용
      if (currentWeekIndex < 1) { // 현재 인덱스가 0이면 첫 번째 주, 1이면 두 번째 주
        // 이전 7일로 이동
        const newEndDate = new Date(currentWeek.startDate);
        newEndDate.setDate(newEndDate.getDate() - 1); // 현재 시작일 하루 전

        const newStartDate = new Date(newEndDate);
        newStartDate.setDate(newEndDate.getDate() - 6); // 7일 전

        setCurrentWeekRange(newStartDate, newEndDate);
        setCurrentWeekIndex(currentWeekIndex + 1);
        
        // 이미 이전 주 데이터를 가지고 있다면, 첫 번째 주에서 두 번째 주로 이동할 때
        // 현재 주 데이터를 이전 주 데이터로 교체
        if (currentWeekIndex === 0 && Object.keys(prevWeekAppUsage).length > 0) {
          setAppUsage(prevWeekAppUsage);
        }
      }
    } else if (direction === "next" && currentWeekIndex > 0) {
      // 다음 주로 이동 (최신 주까지만)
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
      
      // 최신 주로 다시 이동할 때 데이터 복원
      if (currentWeekIndex === 1) {
        // 서버에서 다시 가져오는 대신 기존 데이터를 재활용
        fetchWeeklyData();
      }
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
      {/* 공통 그래프 컴포넌트 사용 */}
      <MiningGraph
        data={weeklyMiningData}
        isScrollable={false}
        dateRangeTitle={`${currentWeek.start} - ${currentWeek.end}`}
        onPrevWeek={() => navigateWeek("prev")}
        onNextWeek={() => navigateWeek("next")}
        isCurrentWeek={currentWeekIndex === 0}
        isPrevDisabled={currentWeekIndex >= 1} // 이 prop 추가
      />

      {/* 공통 채굴 통계 컴포넌트 사용 */}
      <MiningStats
        viewType="weekly"
        miningData={weeklyMiningData}
        comparisonValue={weeklyComparison}
        totalMiningTime={{
          hours: weeklyTotalTime.hours,
          minutes: weeklyTotalTime.minutes,
        }}
      />

      {/* 공통 앱 사용 통계 컴포넌트 사용 */}
      <AppUsageStats 
        viewType="weekly" 
        appUsage={appUsage} 
        prevWeekAppUsage={prevWeekAppUsage} // 이전 주 앱 사용 데이터 전달
        weekInfo={{
          title: `${currentWeek.start} - ${currentWeek.end}`,
          currentWeekIndex: currentWeekIndex
        }}
      />
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
});

export default WeeklyView;