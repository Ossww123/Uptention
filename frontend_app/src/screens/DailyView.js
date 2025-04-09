// DailyView.js
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Text,
} from "react-native";
import ScreenTime from "../utils/ScreenTime";
import { get } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import MiningGraph from "../components/MiningGraph"; // 공통 그래프 컴포넌트
import MiningStats from "../components/MiningStats"; // 공통 통계 컴포넌트
import AppUsageStats from "../components/AppUsageStats"; // 공통 앱 사용 컴포넌트

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

  // 채굴 데이터 상태
  const [miningData, setMiningData] = useState([]);

  useEffect(() => {
    fetchMiningData();
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

          const capMiningTime = (totalMinutes) => {
            return Math.min(totalMinutes, 480); // 8시간(480분) 제한
          };

          // API 응답에서 해당 날짜의 데이터 찾기
          const dayData = apiData.find((item) => item.date === formattedDate);
          const totalTime = dayData ? capMiningTime(dayData.totalTime) : 0;

          // 시간과 분 계산
          const hours = Math.floor(totalTime / 60);
          const minutes = totalTime % 60;

          miningDataArray.push({
            id: `${month}-${day}`,
            day: day.toString(),
            month: month,
            value: totalTime > 0 ? totalTime : 5, // 데이터가 0이면 최소값 5로 설정
            dayOfWeek: dayOfWeek,
            isToday: i === 0,
            miningTime: {
              hours: hours,
              minutes: minutes,
              totalMinutes: totalTime,
            },
          });
        }

        setMiningData(miningDataArray);

        // 오늘 데이터를 기본 선택으로 설정
        const todayData = miningDataArray.find((item) => item.isToday);
        setSelectedDayData(todayData);

        // 오늘과 어제의 채굴 시간 차이 계산
        if (miningDataArray.length >= 2) {
          const todayIndex = miningDataArray.findIndex((item) => item.isToday);
          if (todayIndex >= 1) {
            // 어제 데이터가 있는지 확인
            const today = miningDataArray[todayIndex].miningTime.totalMinutes;
            const yesterday =
              miningDataArray[todayIndex - 1].miningTime.totalMinutes;
            setMiningDifference(today - yesterday);
          }
        }

        // 현재 선택된 날짜의 앱 사용 데이터 가져오기
        fetchAppUsageData(todayData);
      } else {
        console.error("채굴 시간 데이터 가져오기 실패:", response.data);

        // API 오류 시 기본 더미 데이터 생성 (개발 중 테스트용)
        const dummyData = generateDummyMiningData();
        setMiningData(dummyData);

        const todayData = dummyData.find((item) => item.isToday);
        setSelectedDayData(todayData);

        // 더미 데이터로 채굴 시간 차이 계산
        if (dummyData.length >= 2) {
          const todayIndex = dummyData.findIndex((item) => item.isToday);
          if (todayIndex >= 1) {
            const today = dummyData[todayIndex].miningTime.totalMinutes;
            const yesterday = dummyData[todayIndex - 1].miningTime.totalMinutes;
            setMiningDifference(today - yesterday);
          }
        }

        // 더미 앱 사용 데이터 설정
        setDummyAppUsageData();
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
        const todayIndex = dummyData.findIndex((item) => item.isToday);
        if (todayIndex >= 1) {
          const today = dummyData[todayIndex].miningTime.totalMinutes;
          const yesterday = dummyData[todayIndex - 1].miningTime.totalMinutes;
          setMiningDifference(today - yesterday);
        }
      }

      // 더미 앱 사용 데이터 설정
      setDummyAppUsageData();
    } finally {
      setLoading(false);
    }
  };

  // 선택한 날짜의 앱 사용 데이터 가져오기
  const fetchAppUsageData = async (selectedDay) => {
    try {
      if (!selectedDay) return;

      // 선택한 날짜 객체 생성
      const selectedDateObj = new Date(
        2025,
        selectedDay.month - 1,
        selectedDay.day
      );

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
      console.error("앱 사용 데이터 가져오기 오류:", error);
      // 오류 발생 시 더미 데이터 설정
      setDummyAppUsageData();
    }
  };

  // 더미 앱 사용 데이터 설정
  const setDummyAppUsageData = () => {
    const dummyAppUsage = {
      "com.google.android.youtube": {
        appName: "YouTube",
        usageTime: 85,
        iconBase64: null,
      },
      "com.kakao.talk": {
        appName: "카카오톡",
        usageTime: 65,
        iconBase64: null,
      },
      "com.instagram.android": {
        appName: "Instagram",
        usageTime: 45,
        iconBase64: null,
      },
    };
    setAppUsage(dummyAppUsage);
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
        day: day.toString(),
        month: month,
        value: value,
        dayOfWeek: dayOfWeek,
        isToday: i === 0,
        miningTime: {
          hours: hours,
          minutes: minutes,
          totalMinutes: totalMinutes,
        },
      });
    }

    return data;
  };

  // 특정 날짜 선택 처리
  const handleSelectDay = async (item) => {
    setSelectedDayData(item);

    // 선택한 날짜 객체 생성
    const selectedDateObj = new Date(2025, item.month - 1, item.day);
    setSelectedDate(selectedDateObj);

    // 선택된 날짜와 전날의 채굴 시간 차이 계산
    const selectedIndex = miningData.findIndex((data) => data.id === item.id);
    if (selectedIndex > 0) {
      // 선택된 날짜 이전 데이터가 있는지 확인
      const selectedTime = miningData[selectedIndex].miningTime.totalMinutes;
      const prevDayTime = miningData[selectedIndex - 1].miningTime.totalMinutes;
      setMiningDifference(selectedTime - prevDayTime);
    } else {
      setMiningDifference(0); // 이전 날짜가 없으면 차이를 0으로 설정
    }

    // 선택한 날짜의 앱 사용 데이터 가져오기
    fetchAppUsageData(item);
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
    
        {/* 공통 채굴 통계 컴포넌트 사용 */}
        {selectedDayData && (
          <MiningStats
            viewType="daily"
            miningData={null}
            comparisonValue={miningDifference}
            totalMiningTime={{
              hours: selectedDayData.miningTime.hours,
              minutes: selectedDayData.miningTime.minutes,
            }}
            maxPossibleHours={8}
          />
        )}
    
        {/* 공통 앱 사용 통계 컴포넌트 사용 - selectedDate 전달 */}
        <AppUsageStats 
          viewType="daily" 
          appUsage={appUsage}
          selectedDate={selectedDayData} // 선택된 날짜 정보 전달
        />
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
});

export default DailyView;
