// DailyView.js
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
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

const DailyView = forwardRef(
  ({ scrollViewRef, onScroll, scrollPosition }, ref) => {
    const { userId } = useAuth(); // AuthContext에서 userId 가져오기
    const [dailyScreenTime, setDailyScreenTime] = useState(0);
    const [appUsage, setAppUsage] = useState({});
    const [loading, setLoading] = useState(true);

    // 새로운 상태 추가: 그래프 스크롤 완료 여부 추적
    const [graphReady, setGraphReady] = useState(false);

    // 현재 선택된 날짜 (기본값은 오늘)
    const [selectedDate, setSelectedDate] = useState(new Date());

    // 선택된 날짜의 데이터
    const [selectedDayData, setSelectedDayData] = useState(null);

    // 전날 대비 채굴 시간 차이
    const [miningDifference, setMiningDifference] = useState(0);

    // 채굴 데이터 상태
    const [miningData, setMiningData] = useState([]);

    // FlatList에 대한 ref 추가
    const flatListRef = useRef(null);

    // 데이터 로딩 완료 상태 추적
    const dataLoadedRef = useRef(false);

    // 스크롤 완료 여부를 체크하기 위한 타이머 ref
    const scrollTimerRef = useRef(null);

    useImperativeHandle(ref, () => ({
      refreshData: async () => {
        setGraphReady(false); // 새로고침 시 그래프 준비 상태 초기화
        const result = await fetchMiningData();
        return result;
      },
    }));

    useEffect(() => {
      fetchMiningData();

      // 컴포넌트 언마운트 시 타이머 정리
      return () => {
        if (scrollTimerRef.current) {
          clearTimeout(scrollTimerRef.current);
        }
      };
    }, []);

    useEffect(() => {
      console.log('Mining Data Updated:', miningData);
      console.log('Mining Data Length:', miningData.length);
      console.log('Loading Status:', loading);
      console.log('Graph Ready:', graphReady);
    }, [miningData, loading, graphReady]);

    // 데이터 로드 후 스크롤 처리를 위한 효과 수정
    useEffect(() => {
      if (miningData.length > 0 && !loading) {
        // 이미 준비된 상태라면 다시 호출하지 않음
        if (!graphReady) {
          prepareScrollToEnd();
        }
      }
    }, [miningData, loading]);

    // 스크롤을 미리 적용하고 준비 상태를 설정하는 함수
    const prepareScrollToEnd = () => {
      if (flatListRef.current) {
        // 먼저 스크롤 적용
        flatListRef.current.scrollToEnd({ animated: false });

        // 안전하게 스크롤이 적용될 시간을 주고 준비 상태로 변경
        scrollTimerRef.current = setTimeout(() => {
          setGraphReady(true);

          // 한번 더 스크롤 적용 (더블 체크)
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }, 200); // 타이밍을 좀 더 길게 설정
      }
    };

    // 최신 데이터로 스크롤하는 함수 (이 함수는 이제 직접 호출하지 않고 준비 과정에서 사용)
    const scrollToLatestData = () => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: false });
      }
    };

    // API에서 채굴 데이터 가져오기
    const fetchMiningData = async () => {
      try {
        setLoading(true);
        setGraphReady(false); // 데이터 로딩 시작할 때 그래프 준비 상태 초기화
        dataLoadedRef.current = false;
    
        // 날짜 범위 계산 (오늘 포함 지난 14일)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 14);
    
        // 타임존 정보를 포함한 ISO 문자열로 변환 (ZonedDateTime 형식으로 전송)
        const formatDateWithZone = (date) => {
          return date.toISOString(); // ISO 8601 형식으로 타임존 정보 포함됨
        };
    
        // 형식화된 날짜 문자열로 변환
        const startTime = formatDateWithZone(startDate);
        const endTime = formatDateWithZone(endDate);
    
        // API 호출 - 수정된 엔드포인트와 파라미터
        const response = await get(
          `/users/${userId}/mining-time?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`
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
            // 백엔드 응답 형식에 맞게 조회 방식 수정
            const dayData = apiData.find((item) => {
              // date 필드는 LocalDate 형식으로 "YYYY-MM-DD" 문자열일 것으로 예상
              return item.date === formattedDate;
            });
            
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
            const todayIndex = miningDataArray.findIndex(
              (item) => item.isToday
            );
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
    
          // 데이터 로드 완료 설정
          dataLoadedRef.current = true;
        } else {
          console.error("채굴 시간 데이터 가져오기 실패:", response.data);
          return false;
        }

        return true; // 처리 완료
      } catch (error) {
        console.error("채굴 시간 데이터 가져오기 오류:", error);
        return false; // 오류 발생
      } finally {
        // 단순히 로딩 상태 해제
        setLoading(false);
        setGraphReady(true);
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
      }
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
        const prevDayTime =
          miningData[selectedIndex - 1].miningTime.totalMinutes;
        setMiningDifference(selectedTime - prevDayTime);
      } else {
        setMiningDifference(0); // 이전 날짜가 없으면 차이를 0으로 설정
      }

      // 선택한 날짜의 앱 사용 데이터 가져오기
      fetchAppUsageData(item);
    };

    if (loading || !graphReady) {
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
        ref={scrollViewRef}
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* 공통 그래프 컴포넌트 사용 */}
        <MiningGraph
          data={miningData}
          isScrollable={true}
          selectedItem={selectedDayData}
          onSelectBar={handleSelectDay}
          dateRangeTitle={dateTitle}
          flatListRef={flatListRef}
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
            isCurrentPeriod={selectedDayData.isToday}
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
  }
);

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