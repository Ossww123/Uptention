// WeeklyView.js
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
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

const WeeklyView = forwardRef(
  ({ scrollViewRef, onScroll, scrollPosition }, ref) => {
    const { userId } = useAuth(); // AuthContext에서 userId 가져오기

    // 로딩 상태
    const [loading, setLoading] = useState(true);
    const [transitionLoading, setTransitionLoading] = useState(false);

    // 앱 사용량 데이터
    const [appUsage, setAppUsage] = useState({});
    // 이전 주 앱 사용량 데이터 추가
    const [prevWeekAppUsage, setPrevWeekAppUsage] = useState({});

    // 주간 채굴 데이터
    const [weeklyMiningData, setWeeklyMiningData] = useState([]);
    const [dataReady, setDataReady] = useState(false); // 데이터 준비 상태 추가

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

    // 데이터 캐싱을 위한 상태
    const [cachedData, setCachedData] = useState({
      0: {
        // 현재 주
        miningData: [],
        totalTime: { hours: 0, minutes: 0, totalMinutes: 0 },
        appUsage: {},
        prevWeekAppUsage: {},
        comparison: 0,
        dateRange: { start: "", end: "", startDate: null, endDate: null },
      },
      1: {
        // 이전 주
        miningData: [],
        totalTime: { hours: 0, minutes: 0, totalMinutes: 0 },
        appUsage: {},
        prevWeekAppUsage: {},
        comparison: 0,
        dateRange: { start: "", end: "", startDate: null, endDate: null },
      },
    });

    // 데이터 일관성을 위한 상태
    const [dataState, setDataState] = useState({
      isLoaded: false,
      isSwitching: false,
      currentData: 0,
    });

    // 주 전환 중복 방지를 위한 ref
    const isSwitchingWeek = useRef(false);

    // 초기 렌더링 여부 추적
    const isInitialRender = useRef(true);

    // ref로 노출할 메서드에 getWeeklyData 추가
    useImperativeHandle(ref, () => ({
      refreshData: () => {
        return refreshCurrentWeekData();
      },
      getWeeklyData: () => {
        return {
          miningData: weeklyMiningData,
          totalTime: weeklyTotalTime,
          appUsage: appUsage,
          prevWeekAppUsage: prevWeekAppUsage,
          dataReady: dataReady,
        };
      },
    }));

    // WeeklyView.js의 useEffect 수정
    useEffect(() => {
      // 컴포넌트 마운트 시 초기 날짜 범위 설정
      setInitialDateRange();
    }, []);

    // 각 주의 시작일과 종료일을 계산하고 데이터 사전 로드
    useEffect(() => {
      if (currentWeek.startDate && currentWeek.endDate) {
        prefetchData();
      }
    }, [currentWeek]);

    // 캐시된 데이터로 상태를 업데이트하는 useEffect 추가
    useEffect(() => {
      if (dataState.isLoaded && cachedData[currentWeekIndex]) {
        // 캐시된 데이터가 있으면 상태 업데이트
        const data = cachedData[currentWeekIndex];
        if (data) {
          setWeeklyMiningData(data.miningData);
          setWeeklyTotalTime(data.totalTime);
          setWeeklyComparison(data.comparison);
          setAppUsage(data.appUsage || {}); // null 체크 추가
          setPrevWeekAppUsage(data.prevWeekAppUsage || {}); // null 체크 추가
          setDataReady(true);
        }
      }
    }, [dataState.isLoaded, currentWeekIndex, cachedData]);

    // 초기 빈 데이터 플레이스홀더 생성
    const generatePlaceholderData = () => {
      const today = new Date();
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      const result = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const dayOfWeek = days[date.getDay()];

        result.push({
          id: `${month}-${day}`,
          day: day.toString(),
          month: month,
          value: 5, // 최소값으로 설정
          dayOfWeek: dayOfWeek,
          isToday: i === 0,
          miningTime: {
            hours: 0,
            minutes: 0,
            totalMinutes: 0,
          },
        });
      }

      return result;
    };

    // 데이터 사전 로딩 함수
    // WeeklyView.js의 prefetchData 함수 수정
    const prefetchData = async () => {
      setLoading(true);

      try {
        // 현재 주 데이터 로드
        const success = await fetchWeeklyData(0, {
          startDate: currentWeek.startDate,
          endDate: currentWeek.endDate,
          start: currentWeek.start,
          end: currentWeek.end,
        });

        if (!success) {
          console.warn("현재 주 데이터 로드 실패");
        }

        // 이전 주 날짜 범위 계산
        const prevEndDate = new Date(currentWeek.startDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);

        const prevStartDate = new Date(prevEndDate);
        prevStartDate.setDate(prevEndDate.getDate() - 6);

        // 날짜 포맷팅 함수
        const formatDateString = (date) => {
          const month = date.getMonth() + 1;
          const day = date.getDate();
          return `${month}월 ${day}일`;
        };

        const prevDateRange = {
          startDate: prevStartDate,
          endDate: prevEndDate,
          start: formatDateString(prevStartDate),
          end: formatDateString(prevEndDate),
        };

        // 이전 주 데이터 로드
        await fetchWeeklyData(1, prevDateRange);

        // 초기 렌더링 플래그 업데이트
        isInitialRender.current = false;
      } catch (error) {
        console.error("데이터 사전 로딩 오류:", error);
      } finally {
        setLoading(false);
        setDataState((prev) => ({
          ...prev,
          isLoaded: true,
        }));
      }
    };

    // 현재 선택된 주 데이터만 새로고침
    const refreshCurrentWeekData = async () => {
      setTransitionLoading(true);

      try {
        const weekIndex = currentWeekIndex;
        const dateRange = cachedData[weekIndex]?.dateRange || currentWeek;

        await fetchWeeklyData(weekIndex, dateRange);

        // 데이터 새로고침 후 현재 상태 업데이트
        switchToWeekData(weekIndex);
      } catch (error) {
        console.error("주간 데이터 새로고침 오류:", error);
      } finally {
        setTransitionLoading(false);
      }

      return true; // 새로고침 완료 신호
    };

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
    // WeeklyView.js의 fetchWeeklyData 함수 수정
    const fetchWeeklyData = async (
      weekIndex = currentWeekIndex,
      dateRange = null
    ) => {
      try {
        if (weekIndex === currentWeekIndex) {
          setTransitionLoading(true);
        }

        // dateRange가 제공되지 않으면 현재 설정된 범위 사용
        const startDate = dateRange
          ? dateRange.startDate
          : currentWeek.startDate;
        const endDate = dateRange ? dateRange.endDate : currentWeek.endDate;
        const startText = dateRange ? dateRange.start : currentWeek.start;
        const endText = dateRange ? dateRange.end : currentWeek.end;

        // API에 전달할 시작/종료 날짜 포맷팅
        const startTime = formatDateForApi(startDate);
        const endTime = formatDateForApi(endDate);

        // API 호출
        const response = await get(
          `/users/${userId}/mining-times?startTime=${startTime}&endTime=${endTime}`
        );

        let miningDataArray = [];
        let totalTimeObject = { hours: 0, minutes: 0, totalMinutes: 0 };
        let randomComparisonValue = 0;
        let currentWeekAppUsage = {};
        let prevWeekAppUsage = {};

        if (response.ok) {
          const apiData = response.data;

          // 이 주의 각 날짜에 대한 데이터 매핑
          miningDataArray = [];
          const days = ["일", "월", "화", "수", "목", "금", "토"];

          let totalMinutes = 0;

          // 시작일부터 종료일까지 데이터 생성 (7일)
          for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

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

          // 주간 총 채굴 시간 계산
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          totalTimeObject = {
            hours: hours,
            minutes: minutes,
            totalMinutes: totalMinutes,
          };

          // 임의의 전주 대비 증감값 설정
          randomComparisonValue = Math.floor(Math.random() * 600) - 300;
        } else {
          console.error("주간 채굴 시간 데이터 가져오기 실패:", response.data);
          // 오류 시 빈 데이터 배열 유지
        }

        // 최근 14일간의 앱 사용 정보 가져오기 - 별도 try/catch로 분리
        try {
          const weeklyScreenTimeData = await ScreenTime.getWeeklyScreenTime(14);

          if (weeklyScreenTimeData.hasPermission) {
            const appUsageData = weeklyScreenTimeData.appUsageWithNames || {};

            // 현재 주와 이전 주의 날짜 범위 계산
            const currentWeekStart = new Date(startDate);
            const currentWeekEnd = new Date(endDate);

            const prevWeekEnd = new Date(currentWeekStart);
            prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);

            const prevWeekStart = new Date(prevWeekEnd);
            prevWeekStart.setDate(prevWeekEnd.getDate() - 6);

            // 날짜별 사용 시간 데이터(dailyScreenTime)에서 현재 주와 이전 주 분리
            const currentWeekDates = {};
            const prevWeekDates = {};

            // ScreenTimeModule에서 제공하는 dailyScreenTime은 날짜별 전체 스크린 타임 매핑
            Object.entries(weeklyScreenTimeData.dailyScreenTime || {}).forEach(
              ([dateStr, screenTime]) => {
                const date = new Date(dateStr);
                if (isDateInRange(date, currentWeekStart, currentWeekEnd)) {
                  currentWeekDates[dateStr] = screenTime;
                } else if (isDateInRange(date, prevWeekStart, prevWeekEnd)) {
                  prevWeekDates[dateStr] = screenTime;
                }
              }
            );

            // 현재 주와 이전 주의 총 스크린 타임 계산
            const currentWeekTotalScreenTime = Object.values(
              currentWeekDates
            ).reduce((sum, time) => sum + time, 0);
            const prevWeekTotalScreenTime = Object.values(prevWeekDates).reduce(
              (sum, time) => sum + time,
              0
            );
            const totalScreenTime =
              currentWeekTotalScreenTime + prevWeekTotalScreenTime;

            // 앱별 사용 시간 데이터 처리 개선
            if (totalScreenTime > 0) {
              // 앱별 사용 시간 데이터
              Object.entries(appUsageData).forEach(([packageName, appInfo]) => {
                // 앱의 총 사용 시간을 현재 주와 이전 주로 비율 기반 분배
                const currentWeekRatio =
                  currentWeekTotalScreenTime / totalScreenTime;
                const prevWeekRatio = prevWeekTotalScreenTime / totalScreenTime;

                // 앱 정보 복사 및 사용 시간 계산
                currentWeekAppUsage[packageName] = {
                  ...appInfo,
                  usageTime: Math.round(appInfo.usageTime * currentWeekRatio),
                };

                prevWeekAppUsage[packageName] = {
                  ...appInfo,
                  usageTime: Math.round(appInfo.usageTime * prevWeekRatio),
                };
              });
            }
          }
        } catch (error) {
          console.error("주간 스크린타임 데이터 가져오기 오류:", error);
          // 스크린타임 데이터 오류시도 채굴 데이터는 계속 표시
        }

        // 데이터 캐싱 및 상태 객체 구성
        const newCachedData = {
          miningData: miningDataArray,
          totalTime: totalTimeObject,
          appUsage: weekIndex === 0 ? currentWeekAppUsage : prevWeekAppUsage,
          prevWeekAppUsage: prevWeekAppUsage,
          comparison: randomComparisonValue,
          dateRange: {
            startDate: startDate,
            endDate: endDate,
            start: startText,
            end: endText,
          },
        };

        // 캐시 데이터 업데이트
        setCachedData((prev) => ({
          ...prev,
          [weekIndex]: newCachedData,
        }));

        // 첫번째 로딩이거나 현재 표시 중인 주 인덱스에 해당하는 데이터라면 즉시 상태 업데이트
        if (weekIndex === currentWeekIndex || isInitialRender.current) {
          // 즉시 상태 업데이트
          setWeeklyMiningData(miningDataArray);
          setWeeklyTotalTime(totalTimeObject);
          setWeeklyComparison(randomComparisonValue);
          setAppUsage(weekIndex === 0 ? currentWeekAppUsage : prevWeekAppUsage);
          setPrevWeekAppUsage(prevWeekAppUsage);
          setDataReady(true); // 데이터 준비 완료 표시
        }

        return true; // 데이터 로드 성공
      } catch (error) {
        console.error("주간 데이터 가져오기 오류:", error);
        return false; // 데이터 로드 실패
      } finally {
        if (weekIndex === currentWeekIndex) {
          setTransitionLoading(false);
        }
      }
    };

    // WeeklyView.js의 switchToWeekData 함수 수정
    const switchToWeekData = (weekIndex) => {
      setDataState((prev) => ({
        ...prev,
        isSwitching: true,
      }));

      // 캐시된 데이터 가져오기
      const data = cachedData[weekIndex];
      if (data) {
        // 모든 상태를 한 번에 업데이트
        setWeeklyMiningData(data.miningData);
        setWeeklyTotalTime(data.totalTime);
        setWeeklyComparison(data.comparison);
        setAppUsage(data.appUsage || {}); // null 체크 추가
        setPrevWeekAppUsage(data.prevWeekAppUsage || {}); // null 체크 추가

        setTimeout(() => {
          setDataState((prev) => ({
            ...prev,
            isSwitching: false,
            currentData: weekIndex,
          }));
        }, 50); // 상태 업데이트 완료를 위한 짧은 지연
      }
    };

    // 이전/다음 주 이동 처리
    const navigateWeek = (direction) => {
      // 전환 중복 방지
      if (isSwitchingWeek.current) return;
      isSwitchingWeek.current = true;

      if (direction === "prev") {
        // 이전 주로 이동할 때 최대 2주(14일) 전까지만 허용
        if (currentWeekIndex < 1) {
          // 이전 주 데이터로 날짜 범위 설정
          const prevWeekData = cachedData[currentWeekIndex + 1];
          if (prevWeekData && prevWeekData.dateRange) {
            // 화면에 표시되는 주 인덱스 변경
            setCurrentWeekIndex(currentWeekIndex + 1);

            // 캐시된 데이터로 화면 업데이트
            switchToWeekData(currentWeekIndex + 1);
          } else {
            // 캐시된 데이터가 없는 경우 - 새로운 날짜 범위 계산
            const newEndDate = new Date(currentWeek.startDate);
            newEndDate.setDate(newEndDate.getDate() - 1); // 현재 시작일 하루 전

            const newStartDate = new Date(newEndDate);
            newStartDate.setDate(newEndDate.getDate() - 6); // 7일 전

            // 날짜 범위 포맷팅
            const formatDateString = (date) => {
              const month = date.getMonth() + 1;
              const day = date.getDate();
              return `${month}월 ${day}일`;
            };

            const newDateRange = {
              startDate: newStartDate,
              endDate: newEndDate,
              start: formatDateString(newStartDate),
              end: formatDateString(newEndDate),
            };

            // 화면에 표시되는 주 인덱스 변경
            setCurrentWeekIndex(currentWeekIndex + 1);

            // 이전 주 데이터 로드 및 화면 업데이트
            fetchWeeklyData(currentWeekIndex + 1, newDateRange);
          }
        }
      } else if (direction === "next" && currentWeekIndex > 0) {
        // 다음 주로 이동 (최신 주까지만)
        const nextWeekData = cachedData[currentWeekIndex - 1];
        if (nextWeekData && nextWeekData.dateRange) {
          // 화면에 표시되는 주 인덱스 변경
          setCurrentWeekIndex(currentWeekIndex - 1);

          // 캐시된 데이터로 화면 업데이트
          switchToWeekData(currentWeekIndex - 1);
        } else {
          // 캐시된 데이터가 없는 경우 - 새로운 날짜 범위 계산
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

          // 날짜 범위 포맷팅
          const formatDateString = (date) => {
            const month = date.getMonth() + 1;
            const day = date.getDate();
            return `${month}월 ${day}일`;
          };

          const newDateRange = {
            startDate: newStartDate,
            endDate: newEndDate,
            start: formatDateString(newStartDate),
            end: formatDateString(newEndDate),
          };

          // 화면에 표시되는 주 인덱스 변경
          setCurrentWeekIndex(currentWeekIndex - 1);

          // 다음 주 데이터 로드 및 화면 업데이트
          fetchWeeklyData(currentWeekIndex - 1, newDateRange);
        }
      }

      // 전환 중복 방지 플래그 해제 (약간 딜레이)
      setTimeout(() => {
        isSwitchingWeek.current = false;
      }, 300);
    };

    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
          <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
        </View>
      );
    }

    // 현재 표시할 날짜 범위
    const currentDateRange =
      cachedData[currentWeekIndex]?.dateRange || currentWeek;

    // 캐시에서 직접 데이터 참조 (상태가 아직 업데이트되지 않았을 경우를 대비)
    const displayMiningData =
      cachedData[currentWeekIndex]?.miningData?.length > 0
        ? cachedData[currentWeekIndex].miningData
        : weeklyMiningData.length > 0
        ? weeklyMiningData
        : generatePlaceholderData();

    return (
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* 그래프 컴포넌트 */}
        <MiningGraph
          data={displayMiningData}
          isScrollable={false}
          dateRangeTitle={`${currentDateRange.start} - ${currentDateRange.end}`}
          onPrevWeek={() => navigateWeek("prev")}
          onNextWeek={() => navigateWeek("next")}
          isCurrentWeek={currentWeekIndex === 0}
          isPrevDisabled={currentWeekIndex >= 1}
        />

        {/* 전환 로딩 인디케이터 */}
        {transitionLoading && (
          <View style={styles.transitionLoading}>
            <ActivityIndicator size="small" color="#FF8C00" />
            <Text style={styles.transitionLoadingText}>
              새로운 데이터를 불러오는 중...
            </Text>
          </View>
        )}

        {/* 공통 채굴 통계 컴포넌트 */}
        <MiningStats
          viewType="weekly"
          miningData={displayMiningData}
          comparisonValue={weeklyComparison}
          totalMiningTime={{
            hours: weeklyTotalTime.hours,
            minutes: weeklyTotalTime.minutes,
          }}
          isCurrentPeriod={currentWeekIndex === 0}
        />

        {/* 공통 앱 사용 통계 컴포넌트 - 어떤 경우든 항상 표시 */}
        <AppUsageStats
          viewType="weekly"
          appUsage={appUsage || {}}
          prevWeekAppUsage={prevWeekAppUsage || {}}
          weekInfo={{
            title: `${currentDateRange.start} - ${currentDateRange.end}`,
            currentWeekIndex: currentWeekIndex,
          }}
        />
      </ScrollView>
    );
  }
);

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
  transitionLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    backgroundColor: "rgba(255, 140, 0, 0.1)",
    borderRadius: 5,
    margin: 10,
  },
  transitionLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#FF8C00",
  },
  dataLoadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  dataLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#888888",
  },
});

export default WeeklyView;
