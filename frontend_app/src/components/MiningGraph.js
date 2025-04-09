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
  isPrevDisabled = false,
  flatListRef = null, // 추가된 prop
}) => {
  // 최대 채굴 시간 계산 (8시간 = 480분)
  const MAX_MINING_TIME = 480;
  // 모든 데이터 중 최대값 확인
  const maxValue = Math.max(...data.map((d) => d.value), MAX_MINING_TIME);

  // 개별 막대 렌더링 함수 - 날짜(일)만 표시
  const renderBar = ({ item, index }) => {
    const MAX_MINING_TIME = 480; // 8시간 = 480분
    const cappedValue = Math.min(item.value, MAX_MINING_TIME);
    const barHeight = (cappedValue / maxValue) * 95;
    const isSelected = selectedItem && selectedItem.id === item.id;
    const isToday = item.isToday || false;

    // 바의 색상 결정
    let barStyle;
    
    if (!isScrollable) {
      // WeeklyView인 경우 모든 막대를 주황색으로
      barStyle = styles.selectedBar;
    } else {
      // DailyView인 경우
      if (isSelected && isToday) {
        // 오늘이면서 선택된 경우 진한 주황색
        barStyle = styles.todaySelectedBar; // 이 스타일을 새로 추가해야 함
      } else if (isSelected) {
        // 선택되었지만 오늘이 아닌 경우 주황색
        barStyle = styles.selectedBar;
      } else if (isToday) {
        // 오늘이지만 선택되지 않은 경우 진한 회색
        barStyle = styles.todayBar; // 이 스타일을 새로 추가해야 함
      } else {
        // 그 외 일반적인 경우 기본 회색
        barStyle = styles.inactiveBar;
      }
    }

    // 텍스트 색상도 동일한 로직으로 결정
    let textStyle;
    
    if (!isScrollable) {
      // WeeklyView에서는 모든 텍스트를 주황색으로
      textStyle = styles.selectedBarText;
    } else {
      // DailyView인 경우
      if (isSelected && isToday) {
        // 오늘이면서 선택된 경우 진한 주황색
        textStyle = styles.todaySelectedBarText; // 이 스타일을 새로 추가해야 함
      } else if (isSelected) {
        // 선택되었지만 오늘이 아닌 경우 주황색
        textStyle = styles.selectedBarText;
      } else if (isToday) {
        // 오늘이지만 선택되지 않은 경우 진한 회색
        textStyle = styles.todayBarText; // 이 스타일을 새로 추가해야 함
      } else {
        // 그 외 일반적인 경우 기본 텍스트 색상
        textStyle = styles.barText;
      }
    }

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
              barStyle,
            ]}
          />
        </View>

        <Text
          style={[
            styles.barText,
            textStyle,
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
            <TouchableOpacity 
              onPress={onPrevWeek}
              disabled={isPrevDisabled} // 비활성화 조건 추가
              style={isPrevDisabled ? styles.disabledNavButton : {}}
            >
              <Text style={[
                styles.navButton,
                isPrevDisabled && styles.disabledNavButtonText
              ]}>{"<"}</Text>
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
          ref={flatListRef} // 추가된 ref
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
          initialNumToRender={data.length} // 모든 항목을 한번에 렌더링
          removeClippedSubviews={false}
          onContentSizeChange={() => {
            // 콘텐츠 크기가 변경될 때 (렌더링 완료 시) 오늘 날짜로 스크롤
            if (isScrollable && flatListRef) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
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
    paddingTop: 0,
    position: "relative",
    height: 185,
    overflow: "visible", // 추가: 내용이 넘쳐도 잘리지 않게 함
  },
  hourLine: {
    position: "absolute",
    top: 5,
    width: "100%",
    zIndex: 0,
  },
  hourLineHalf: {
    top: 62,
  },
  hourLineDivider: {
    height: 1,
    backgroundColor: "#DDD",
    width: "100%",
    opacity: 0.7,
  },
  barsContainer: {
    height: 160,
    alignItems: "flex-end",
    paddingBottom: 40,
    zIndex: 5,
    overflow: "visible", // 추가: 내용이 넘쳐도 잘리지 않게 함
  },
  fixedBarsContainer: {
    justifyContent: "space-between", // 7개 막대를 균일하게 분포
    width: "85%", // 전체 너비 사용
    minWidth: "85%", // 최소 너비 설정
  },
  barContainer: {
    alignItems: "center",
    width: 40,
    marginHorizontal: 1,
  },
  barWrapper: {
    paddingTop: 30,
    height: "100%",
    justifyContent: "flex-end",
    overflow: "visible", // 추가: 내용이 넘쳐도 잘리지 않게 함
  },
  bar: {
    width: 16,
    borderRadius: 8,
    minHeight: 10,
  },
  // 바 스타일
  activeBar: {
    backgroundColor: "#909090",
  },
  inactiveBar: {
    backgroundColor: "#D0D0D0",
  },
  selectedBar: {
    backgroundColor: "#FFA54F",
  },
  todayBar: {
    backgroundColor: "#707070", // 오늘이지만 선택되지 않은 경우 진한 회색
  },
  todaySelectedBar: {
    backgroundColor: "#FF8C00", // 오늘이면서 선택된 경우 진한 주황색
  },
  // 텍스트 스타일
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
  todayBarText: {
    color: "#505050", // 오늘이지만 선택되지 않은 경우 진한 회색
    fontWeight: "500",
  },
  todaySelectedBarText: {
    color: "#FF8C00", // 오늘이면서 선택된 경우 진한 주황색
    fontWeight: "bold", // 더 강조하기 위해 bold로 설정
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