// MiningGraph.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

const MiningGraph = ({
  data,
  isScrollable = false,
  selectedItem = null,
  onSelectBar = () => {},
  dateRangeTitle,
  onPrevWeek = null,
  onNextWeek = null,
  isCurrentWeek = true,
}) => {
  // 최대 채굴 시간 계산 (8시간 = 480분)
  const MAX_MINING_TIME = 480;
  // 모든 데이터 중 최대값 확인
  const maxValue = Math.max(...data.map((d) => d.value), MAX_MINING_TIME);

  // 개별 막대 렌더링 함수 - 날짜(일)만 표시
  const renderBar = ({ item, index }) => {
    const MAX_MINING_TIME = 480; // 8시간 = 480분
    const cappedValue = Math.min(item.value, MAX_MINING_TIME);
    const barHeight = (cappedValue / maxValue) * 100;
    const isSelected = selectedItem && selectedItem.id === item.id;
    const isToday = item.isToday || false;

    return (
      <TouchableOpacity
        style={[styles.barContainer, !isScrollable && { width: width / 9 }]}
        onPress={() => onSelectBar(item)}
        disabled={!isScrollable}
      >
        <View style={styles.barWrapper}>
          <View
            style={[
              styles.bar,
              { height: `${barHeight}%` },
              isToday ? styles.activeBar : styles.inactiveBar,
              isSelected && !isToday && styles.selectedBar,
            ]}
          />
        </View>

        <Text
          style={[
            styles.barText,
            isToday && styles.activeBarText,
            isSelected && !isToday && styles.selectedBarText,
          ]}
        >
          {item.day || "?"} {/* 값이 없는 경우 ? 표시 */}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.chartContainer}>
      {/* 날짜 타이틀 영역 - 높이 일관성을 위해 동일한 컨테이너 사용 */}
      <View style={styles.titleContainer}>
        {onPrevWeek && onNextWeek ? (
          <View style={styles.weekNavigator}>
            <TouchableOpacity onPress={onPrevWeek}>
              <Text style={styles.navButton}>{"<"}</Text>
            </TouchableOpacity>
            <Text style={styles.dateTitle}>{dateRangeTitle}</Text>
            <TouchableOpacity
              onPress={onNextWeek}
              disabled={isCurrentWeek}
              style={isCurrentWeek ? styles.disabledNavButton : {}}
            >
              <Text
                style={[
                  styles.navButton,
                  isCurrentWeek && styles.disabledNavButtonText,
                ]}
              >
                {">"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.singleDateContainer}>
            <Text style={styles.dateTitle}>{dateRangeTitle}</Text>
          </View>
        )}
      </View>

      <View style={styles.chartContent}>
        {/* 8시간 표시선 */}
        <View style={styles.hourLine}>
          <View style={styles.hourLineDivider} />
        </View>

        {/* 4시간 표시선 */}
        <View style={[styles.hourLine, styles.hourLineHalf]}>
          <View style={styles.hourLineDivider} />
        </View>

        {/* DailyView와 WeeklyView 모두 FlatList 사용 */}
        <FlatList
          data={data}
          renderItem={renderBar}
          keyExtractor={(item) => item.id || `${item.month}-${item.day}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={isScrollable} // DailyView만 스크롤 가능
          contentContainerStyle={[
            styles.barsContainer,
            !isScrollable && styles.fixedBarsContainer, // WeeklyView인 경우 추가 스타일 적용
          ]}
          initialNumToRender={isScrollable ? 7 : data.length}
        />

        <View style={styles.chartDivider} />
        <Text style={styles.updateTimeText}>
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          에 업데이트됨
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    margin: 20,
    marginTop: 0,
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 15,
  },
  // 날짜 타이틀 영역을 위한 공통 컨테이너 - 일관된 높이 유지
  titleContainer: {
    height: 50, // 날짜 표시 영역 높이 고정
    justifyContent: "center", // 수직 중앙 정렬
    marginBottom: 10,
  },
  weekNavigator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  singleDateContainer: {
    alignItems: "center", // 가운데 정렬
    justifyContent: "center", // 수직 중앙 정렬
  },
  navButton: {
    fontSize: 24,
    color: "#666",
    paddingHorizontal: 10,
  },
  disabledNavButton: {
    opacity: 0.5,
  },
  disabledNavButtonText: {
    color: "#ccc",
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  chartContent: {
    paddingBottom: 5,
    paddingTop: 30, // 상단에 표시선을 위한 공간 확보
    position: "relative",
    height: 170, // 높이 일관성을 위해 조정
  },
  hourLine: {
    position: "absolute",
    top: 0,
    width: "100%",
    zIndex: 1,
  },
  hourLineHalf: {
    top: 45,
  },
  hourLineDivider: {
    height: 1,
    backgroundColor: "#DDD",
    width: "100%",
    opacity: 0.7,
  },
  barsContainer: {
    height: 115,
    alignItems: "flex-end",
    paddingBottom: 40, // 더 큰 패딩으로 텍스트 공간 확보
    zIndex: 5,
  },
  fixedBarsContainer: {
    justifyContent: "space-between", // 7개 막대를 균일하게 분포
    width: "100%", // 전체 너비 사용
    minWidth: "100%", // 최소 너비 설정
  },
  barContainer: {
    alignItems: "center",
    width: 45,
    marginHorizontal: 2,
  },
  barWrapper: {
    height: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    width: 16,
    borderRadius: 8,
    minHeight: 10,
  },
  activeBar: {
    backgroundColor: "#FF8C00",
  },
  inactiveBar: {
    backgroundColor: "#D0D0D0",
  },
  selectedBar: {
    backgroundColor: "#FFA54F",
  },
  barText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  activeBarText: {
    color: "#FF8C00",
    fontWeight: "500",
  },
  selectedBarText: {
    color: "#FFA54F",
    fontWeight: "500",
  },
  chartDivider: {
    height: 1,
    backgroundColor: "#DDD",
    marginTop: 5,
  },
  updateTimeText: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 5,
  },
});

export default MiningGraph;
