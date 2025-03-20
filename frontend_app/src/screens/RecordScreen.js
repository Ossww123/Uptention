// RecordScreen.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import ScreenTime from "../utils/ScreenTime"; // 경로는 실제 프로젝트 구조에 맞게 조정해주세요

const RecordScreen = () => {
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [viewMode, setViewMode] = useState("daily"); // 'daily' 또는 'weekly'
  const [dailyScreenTime, setDailyScreenTime] = useState(0);
  const [appUsage, setAppUsage] = useState({});
  const [weeklyData, setWeeklyData] = useState({});

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const granted = await ScreenTime.hasUsageStatsPermission();
      setHasPermission(granted);

      if (granted) {
        fetchScreenTimeData();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("권한 확인 오류:", error);
      setLoading(false);
    }
  };

  const requestPermission = () => {
    Alert.alert(
      "권한 필요",
      "스크린 타임 정보를 가져오기 위해 사용량 접근 권한이 필요합니다.",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "설정 열기",
          onPress: () => {
            ScreenTime.openUsageSettings();
          },
        },
      ]
    );
  };

  const fetchScreenTimeData = async () => {
    try {
      setLoading(true);
      // 일일 스크린 타임 데이터 가져오기
      const dailyData = await ScreenTime.getDailyScreenTime();

      if (dailyData.hasPermission) {
        setDailyScreenTime(dailyData.totalScreenTimeMinutes);
        setAppUsage(dailyData.appUsage || {});
      } else {
        setHasPermission(false);
      }

      // 주간 스크린 타임 데이터 가져오기
      const weeklyData = await ScreenTime.getWeeklyScreenTime();

      if (weeklyData.hasPermission) {
        setWeeklyData(weeklyData.dailyScreenTime || {});
      }

      setLoading(false);
    } catch (error) {
      console.error("스크린 타임 데이터 가져오기 오류:", error);
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);

    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${
      days[date.getDay()]
    })`;
  };

  // 패키지 이름에서 앱 이름 추출 (실제로는 앱 이름 매핑 테이블이 필요할 수 있음)
  const getAppName = (packageName) => {
    const parts = packageName.split(".");
    return parts[parts.length - 1];
  };

  const renderPermissionRequest = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.permissionText}>
        스크린 타임 정보를 표시하려면 사용량 접근 권한이 필요합니다.
      </Text>
      <TouchableOpacity
        style={styles.permissionButton}
        onPress={requestPermission}
      >
        <Text style={styles.permissionButtonText}>권한 요청</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDailyView = () => (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>오늘의 스크린 타임</Text>
        <Text style={styles.statsValue}>{formatTime(dailyScreenTime)}</Text>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>앱별 사용 시간</Text>
        {Object.entries(appUsage)
          .sort(([, timeA], [, timeB]) => timeB - timeA)
          .slice(0, 10) // 상위 10개 앱만 표시
          .map(([packageName, minutes], index) => (
            <View key={packageName} style={styles.appItem}>
              <Text style={styles.appName}>{getAppName(packageName)}</Text>
              <Text style={styles.appTime}>{formatTime(minutes)}</Text>
            </View>
          ))}
      </View>
    </ScrollView>
  );

  const renderWeeklyView = () => (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>주간 스크린 타임</Text>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>최근 7일간 사용 시간</Text>
        {Object.entries(weeklyData)
          .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
          .map(([date, minutes]) => (
            <View key={date} style={styles.appItem}>
              <Text style={styles.appName}>{formatDate(date)}</Text>
              <Text style={styles.appTime}>{formatTime(minutes)}</Text>
            </View>
          ))}
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1C6BF9" />
        <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!hasPermission ? (
        renderPermissionRequest()
      ) : (
        <>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                viewMode === "daily" && styles.activeTab,
              ]}
              onPress={() => setViewMode("daily")}
            >
              <Text
                style={[
                  styles.tabText,
                  viewMode === "daily" && styles.activeTabText,
                ]}
              >
                일별
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                viewMode === "weekly" && styles.activeTab,
              ]}
              onPress={() => setViewMode("weekly")}
            >
              <Text
                style={[
                  styles.tabText,
                  viewMode === "weekly" && styles.activeTabText,
                ]}
              >
                주별
              </Text>
            </TouchableOpacity>
          </View>

          {viewMode === "daily" ? renderDailyView() : renderWeeklyView()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
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
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#333333",
  },
  permissionButton: {
    backgroundColor: "#1C6BF9",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#EEEEEE",
  },
  activeTab: {
    borderBottomColor: "#1C6BF9",
  },
  tabText: {
    fontSize: 16,
    color: "#999999",
  },
  activeTabText: {
    color: "#1C6BF9",
    fontWeight: "bold",
  },
  scrollContainer: {
    flex: 1,
  },
  statsContainer: {
    margin: 16,
    padding: 20,
    backgroundColor: "#F7F9FC",
    borderRadius: 12,
    alignItems: "center",
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 10,
  },
  statsValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1C6BF9",
  },
  sectionContainer: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 16,
  },
  appItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  appName: {
    fontSize: 15,
    color: "#333333",
  },
  appTime: {
    fontSize: 15,
    color: "#1C6BF9",
    fontWeight: "500",
  },
});

export default RecordScreen;
