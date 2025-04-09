// RecordScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import ScreenTime from "../utils/ScreenTime";
import DailyView from "./DailyView";
import WeeklyView from "./WeeklyView";

const { width } = Dimensions.get('window');

const RecordScreen = () => {
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [viewMode, setViewMode] = useState(0); // 0: 일간, 1: 주간
  const [refreshing, setRefreshing] = useState(false);
  const pagerRef = useRef(null);

  // DailyView와 WeeklyView 컴포넌트에 대한 ref 생성
  const dailyViewRef = useRef(null);
  const weeklyViewRef = useRef(null);

  // 스크롤 위치를 공유하기 위한 상태와 ref
  const [scrollPosition, setScrollPosition] = useState(0);
  const dailyScrollViewRef = useRef(null);
  const weeklyScrollViewRef = useRef(null);

  useEffect(() => {
    checkPermission();
  }, []);

  // 스크롤 위치가 변경될 때 호출되는 함수
  const handleScroll = (event) => {
    const newPosition = event.nativeEvent.contentOffset.y;
    setScrollPosition(newPosition);
  };

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

  // 새로고침 기능 구현
  const handleRefresh = async () => {
    if (!hasPermission) return;
    
    setRefreshing(true);
    
    try {
      // 현재 선택된 탭에 따라 적절한 컴포넌트의 새로고침 메서드 호출
      if (viewMode === 0 && dailyViewRef.current) {
        await dailyViewRef.current.refreshData();
      } else if (viewMode === 1 && weeklyViewRef.current) {
        await weeklyViewRef.current.refreshData();
      }
    } catch (error) {
      console.error("새로고침 오류:", error);
      Alert.alert("오류", "데이터를 새로고침하는 중 문제가 발생했습니다.");
    } finally {
      setRefreshing(false);
    }
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

  // 탭 전환 핸들러
  const handleTabChange = (index) => {
    setViewMode(index);
    pagerRef.current?.setPage(index);
  };

  // 페이지 전환 이벤트 핸들러
  const handlePageSelected = (e) => {
    const position = e.nativeEvent.position;
    setViewMode(position);
    
    // 페이지 전환 시 스크롤 위치 동기화
    setTimeout(() => {
      if (position === 0 && dailyScrollViewRef.current) {
        dailyScrollViewRef.current.scrollTo({ y: scrollPosition, animated: false });
      } else if (position === 1 && weeklyScrollViewRef.current) {
        weeklyScrollViewRef.current.scrollTo({ y: scrollPosition, animated: false });
      }
    }, 50); // 약간의 딜레이를 주어 전환이 완료된 후 스크롤 위치를 설정
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 헤더 - 새로고침 버튼 추가 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>채굴 기록</Text>
        {hasPermission && (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={24} 
              color="#FF8C00"
              style={[refreshing && styles.refreshing]} 
            />
          </TouchableOpacity>
        )}
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
                viewMode === 0 && styles.activeTabButton,
              ]}
              onPress={() => handleTabChange(0)}
            >
              <Text
                style={[
                  styles.tabText,
                  viewMode === 0 && styles.activeTabText,
                ]}
              >
                Day
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tabButton,
                viewMode === 1 && styles.activeTabButton,
              ]}
              onPress={() => handleTabChange(1)}
            >
              <Text
                style={[
                  styles.tabText,
                  viewMode === 1 && styles.activeTabText,
                ]}
              >
                Week
              </Text>
            </TouchableOpacity>
          </View>

          {/* 로딩 인디케이터 - 새로고침 중일 때 표시 */}
          {/* {refreshing && (
            <View style={styles.refreshingIndicator}>
              <ActivityIndicator size="small" color="#FF8C00" />
              <Text style={styles.refreshingText}>새로고침 중...</Text>
            </View>
          )} */}

          {/* 페이저뷰로 슬라이드 전환 구현 */}
          <PagerView
            ref={pagerRef}
            style={styles.pagerView}
            initialPage={0}
            onPageSelected={handlePageSelected}
          >
            {/* 일간 뷰 */}
            <View key="1">
              <DailyView 
                ref={dailyViewRef}
                scrollViewRef={dailyScrollViewRef}
                onScroll={handleScroll}
                scrollPosition={scrollPosition}
              />
            </View>
            
            {/* 주간 뷰 */}
            <View key="2">
              <WeeklyView 
                ref={weeklyViewRef}
                scrollViewRef={weeklyScrollViewRef}
                onScroll={handleScroll}
                scrollPosition={scrollPosition}
              />
            </View>
          </PagerView>
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
  refreshButton: {
    padding: 8,
    borderRadius: 20,
  },
  refreshing: {
    opacity: 0.5,
    transform: [{ rotate: '45deg' }],
  },
  refreshingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
  },
  refreshingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF8C00',
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
  pagerView: {
    flex: 1,
  },
});

export default RecordScreen;