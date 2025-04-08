// AppUsageStats.js 수정
import React from "react";
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const AppUsageStats = ({
  viewType = "daily", // 'daily' 또는 'weekly'
  appUsage = {}, // 앱 사용 데이터
  selectedDate = null, // 선택된 날짜 정보
  weekInfo = null, // 주간 정보 추가
}) => {
  const navigation = useNavigation();
  
  // 자세히 보기 버튼 핸들러
  const handleViewDetail = () => {
    navigation.navigate("UsageStatsDetail", {
      viewType: viewType,
      appUsage: appUsage,
      totalScreenTime: calculateTotalScreenTime(),
      selectedDate: selectedDate,
      weekInfo: weekInfo, // 주간 정보 전달
    });
  };
  
  // 총 스크린 사용 시간 계산
  const calculateTotalScreenTime = () => {
    if (Object.keys(appUsage).length === 0) return 0;
    
    return Object.values(appUsage).reduce(
      (total, app) => total + app.usageTime, 
      0
    );
  };

  // 앱 사용 시간 바 너비 계산
  const getBarWidth = (usageTime) => {
    // 앱 중 최대 사용 시간 찾기
    if (Object.keys(appUsage).length === 0) return 0;

    const maxTime = Math.max(
      ...Object.values(appUsage).map((data) => data.usageTime)
    );

    // 최대 너비의 70%까지만 사용
    const maxWidth = width * 0.7;
    return maxTime > 0 ? (usageTime / maxTime) * maxWidth : 0;
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
          source={require("../../assets/android-icon.png")}
          style={styles.appIcon}
          resizeMode="contain"
        />
      );
    }
  };

  // 타이틀 텍스트 결정
  const title = (() => {
    if (viewType === "daily") {
      return "가장 많이 사용한 앱";
    } else {
      // 현재 주 표시 (currentWeekIndex: 0=현재주, 1=이전주)
      if (weekInfo && weekInfo.currentWeekIndex > 0) {
        return `이전 주간 많이 사용한 앱`;
      } else {
        return "최근 7일간 많이 사용한 앱";
      }
    }
  })();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={handleViewDetail}>
          <Text style={styles.viewMoreText}>자세히 보기</Text>
        </TouchableOpacity>
      </View>

      {Object.keys(appUsage).length > 0 ? (
        Object.entries(appUsage)
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
                  {/* <Ionicons name="chevron-forward" size={16} color="#888" /> */}
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
          })
      ) : (
        <Text style={styles.noDataText}>앱 사용 데이터가 없습니다.</Text>
      )}

      <View style={styles.timezoneContainer}>
        <Text style={styles.timezoneText}>
          채굴 시간은 한국 시간(UTC+9) 기준입니다.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
    marginTop: 0,
    marginBottom: 100, // 하단 여백
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "500",
  },
  viewMoreText: {
    fontSize: 14,
    color: "#007AFF",
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
  noDataText: {
    textAlign: "center",
    marginVertical: 20,
    color: "#666",
  },
});

export default AppUsageStats;