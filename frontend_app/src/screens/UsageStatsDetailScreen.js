// UsageStatsDetailScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const UsageStatsDetailScreen = ({ route, navigation }) => {
  const { viewType, appUsage, totalScreenTime, selectedDate, weekInfo } = route.params;
  const [sortedApps, setSortedApps] = useState([]);
  
  // 앱 사용 데이터를 사용 시간 순으로 정렬
  useEffect(() => {
    const appList = Object.entries(appUsage || {}).map(([packageName, data]) => ({
      packageName,
      ...data
    }));
    
    appList.sort((a, b) => b.usageTime - a.usageTime);
    setSortedApps(appList);
  }, [appUsage]);

  // 헤더 제목 생성 함수
  const getHeaderTitle = () => {
    if (viewType === 'daily') {
      if (selectedDate) {
        return `${selectedDate.month}월 ${selectedDate.day}일 사용 앱`;
      } else {
        return '오늘의 사용 앱';
      }
    } else {
      if (weekInfo && weekInfo.currentWeekIndex > 0) {
        return `이전 주간 사용 앱`;
      } else {
        return '최근 7일간 사용 앱';
      }
    }
  };

  // 통계 카드 제목 생성 함수
  const getTitle = () => {
    if (viewType === 'daily') {
      if (selectedDate) {
        return `${selectedDate.month}월 ${selectedDate.day}일 사용 통계`;
      } else {
        return '오늘의 사용 통계';
      }
    } else {
      if (weekInfo) {
        if (weekInfo.currentWeekIndex > 0) {
          return `이전 주간(${weekInfo.title}) 사용 통계`;
        } else {
          return `최근 주간(${weekInfo.title}) 사용 통계`;
        }
      } else {
        return '주간 사용 통계';
      }
    }
  };

  // 리스트 제목 생성 함수
  const getListTitle = () => {
    if (viewType === 'daily') {
      if (selectedDate) {
        return `${selectedDate.month}월 ${selectedDate.day}일 사용한 앱 목록`;
      } else {
        return '오늘 사용한 앱 목록';
      }
    } else {
      if (weekInfo && weekInfo.currentWeekIndex > 0) {
        return `${weekInfo.title} 사용한 앱 목록`;
      } else {
        return '최근 7일간 사용한 앱 목록';
      }
    }
  };
  
  // 시간 포맷팅 (분 -> 시간:분)
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
  };
  
  // 앱 아이콘 렌더링 함수
const renderAppIcon = (data) => {
  if (data.iconBase64) {
    if (data.iconBase64.type === 'resource') {
      // 리소스 이미지인 경우
      return (
        <Image
          source={data.iconBase64.source}
          style={styles.appIcon}
          resizeMode="contain"
        />
      );
    } else if (data.iconBase64.type === 'base64') {
      // Base64 이미지인 경우
      return (
        <Image
          source={{ uri: `data:image/png;base64,${data.iconBase64.data}` }}
          style={styles.appIcon}
          resizeMode="contain"
        />
      );
    }
  }
  
  // 아이콘이 없는 경우 기본 이미지 사용
  return (
    <Image
      source={require("../../assets/android-icon.png")}
      style={styles.appIcon}
      resizeMode="contain"
    />
  );
};
  
  // 앱 목록 아이템 렌더링
  const renderAppItem = ({ item, index }) => {
    const barWidth = Math.max(
      (item.usageTime / (sortedApps[0]?.usageTime || 1)) * 70,
      5
    );
    
    return (
      <View style={styles.appItem}>
        <Text style={styles.rankText}>{index + 1}</Text>
        {renderAppIcon(item)}
        <View style={styles.appInfo}>
          <Text style={styles.appName} numberOfLines={1}>{item.appName}</Text>
          <Text style={styles.appTime}>{formatTime(item.usageTime)}</Text>
        </View>
        <View style={styles.barContainer}>
          <View style={[styles.bar, { width: `${barWidth}%` }]} />
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {getHeaderTitle()}
        </Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>
          {getTitle()}
        </Text>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>총 사용 시간</Text>
            <Text style={styles.statValue}>{formatTime(totalScreenTime)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>사용한 앱</Text>
            <Text style={styles.statValue}>{sortedApps.length}개</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.listTitle}>
        {getListTitle()}
      </Text>
      
      <FlatList
        data={sortedApps}
        renderItem={renderAppItem}
        keyExtractor={(item) => item.packageName}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        removeClippedSubviews={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>사용 데이터가 없습니다.</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  statsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#DDD',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 8,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  rankText: {
    width: 24,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  placeholderIcon: {
    backgroundColor: '#DDD',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  appTime: {
    fontSize: 14,
    color: '#666',
  },
  barContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: '#EFEFEF',
  },
  bar: {
    height: '100%',
    backgroundColor: '#FF8C00',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#888',
  },
});

export default UsageStatsDetailScreen;