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
  Image,
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
        
        // 수정된 부분: 앱 이름이 포함된 appUsageWithNames 사용
        setAppUsage(dailyData.appUsageWithNames || {});
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
          .sort(([, dataA], [, dataB]) => dataB.usageTime - dataA.usageTime)
          .slice(0, 10) // 상위 10개 앱만 표시
          .map(([packageName, data], index) => (
            <View key={packageName} style={styles.appItem}>
              {/* 앱 아이콘 영역 (추후 실제 앱 아이콘 구현 가능) */}
              <View style={styles.appIconContainer}>
                <View style={styles.appIcon}>
                  <Text style={styles.appIconText}>{data.appName.charAt(0)}</Text>
                </View>
                <Text style={styles.appName}>{data.appName}</Text>
              </View>
              <Text style={styles.appTime}>{formatTime(data.usageTime)}</Text>
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
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  appIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  appIconText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },
  appName: {
    fontSize: 15,
    color: "#333333",
    flex: 1,
  },
  appTime: {
    fontSize: 15,
    color: "#1C6BF9",
    fontWeight: "500",
  },
});

export default RecordScreen;