// RecordScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import ScreenTime from "../utils/ScreenTime";
import DailyView from "./DailyView"; // 기존 일간 뷰를 별도 컴포넌트로 분리했다고 가정
import WeeklyView from "./WeeklyView"; // 새로 만든 주간 뷰 컴포넌트

const RecordScreen = () => {
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [viewMode, setViewMode] = useState("day"); // 'day' 또는 'week'

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const granted = await ScreenTime.hasUsageStatsPermission();
      setHasPermission(granted);
      setLoading(false);
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>채굴 기록</Text>
      </View>
      
      {!hasPermission ? (
        renderPermissionRequest()
      ) : (
        <>
          {/* 일간/주간 탭 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                viewMode === "day" && styles.activeTabButton,
              ]}
              onPress={() => setViewMode("day")}
            >
              <Text
                style={[
                  styles.tabText,
                  viewMode === "day" && styles.activeTabText,
                ]}
              >
                Day
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tabButton,
                viewMode === "week" && styles.activeTabButton,
              ]}
              onPress={() => setViewMode("week")}
            >
              <Text
                style={[
                  styles.tabText,
                  viewMode === "week" && styles.activeTabText,
                ]}
              >
                Week
              </Text>
            </TouchableOpacity>
          </View>

          {/* 일간/주간 뷰 렌더링 */}
          {viewMode === "day" ? <DailyView /> : <WeeklyView />}
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
    backgroundColor: "#FF8C00",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },
  helpButton: {
    padding: 5,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 25,
    backgroundColor: "#F0F0F0",
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  activeTabButton: {
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  tabText: {
    fontSize: 16,
    color: "#888",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FF8C00",
    fontWeight: "500",
  },
});

export default RecordScreen;