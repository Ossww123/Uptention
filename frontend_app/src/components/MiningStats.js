// MiningStats.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
} from "react-native";

// 채굴 통계 공통 컴포넌트
const MiningStats = ({
  viewType = "daily", // 'daily' 또는 'weekly'
  miningData = null, // 채굴 데이터 (일간 또는 주간)
  comparisonValue = 0, // 비교값 (어제 대비 또는 지난주 대비)
  totalMiningTime = { hours: 0, minutes: 0 }, // 총 채굴 시간
  maxPossibleHours = 8, // 하루 최대 채굴 가능 시간
}) => {

  // 채굴 시간 포맷팅 함수
  const formatMiningTime = (hours, minutes) => {
    if (hours === 0 && minutes === 0) return "0분";
    if (hours === 0) return `${minutes}분`;
    if (minutes === 0) return `${hours}시간`;
    return `${hours}시간 ${minutes}분`;
  };

  // 비교값(어제 또는 전주 대비) 포맷팅
  const formatComparisonValue = (value) => {
    const absValue = Math.abs(value);
    const hours = Math.floor(absValue / 60);
    const minutes = absValue % 60;
    
    let timeText = "";
    if (hours > 0) {
      timeText += `${hours}시간 `;
    }
    timeText += `${minutes}분`;
    
    return {
      isPositive: value > 0,
      text: timeText,
    };
  };

  // 채굴 달성률 계산 (하루 최대 8시간 기준)
  const calculateDailyProgress = () => {
    const totalMinutes = Math.min(totalMiningTime.hours * 60 + totalMiningTime.minutes, 480);
    const maxMinutes = maxPossibleHours * 60;
    return Math.min(Math.round((totalMinutes / maxMinutes) * 100), 100);
  };

  // 주간 일평균 계산
  const calculateWeeklyAverage = () => {
    const totalMinutes = totalMiningTime.hours * 60 + totalMiningTime.minutes;
    const avgMinutes = Math.round(totalMinutes / 7);
    return {
      hours: Math.floor(avgMinutes / 60),
      minutes: avgMinutes % 60
    };
  };

  // 동기부여 메시지 생성 (채굴 시간에 따라 다른 메시지)
  const getMotivationalMessage = () => {
    const totalMinutes = totalMiningTime.hours * 60 + totalMiningTime.minutes;
    
    if (viewType === 'daily') {
      // 일간 뷰 메시지
      if (totalMinutes === 0) return "오늘 첫 채굴을 시작해보세요!";
      if (totalMinutes < 30) return "조금씩이라도 꾸준히 채굴해보세요!";
      if (totalMinutes < 60) return "좋은 시작이에요. 계속 집중해보세요!";
      if (totalMinutes < 120) return "훌륭해요! 집중력이 좋네요.";
      if (totalMinutes < 240) return "대단해요! 오늘 집중력이 최고에요.";
      return "오늘 채굴 마스터! 놀라운 집중력이네요!";
    } else {
      // 주간 뷰 메시지
      if (totalMinutes === 0) return "이번 주 첫 채굴을 시작해보세요!";
      if (totalMinutes < 120) return "시작이 반이에요. 조금씩 늘려보세요!";
      if (totalMinutes < 360) return "꾸준히 채굴 중이네요. 좋아요!";
      if (totalMinutes < 600) return "이번 주 채굴이 순조롭네요!";
      if (totalMinutes < 1200) return "대단해요! 채굴 열심히 하고 계시네요.";
      return "채굴 챔피언! 이번 주 정말 열심히 하셨네요!";
    }
  };

  // 비교 메시지 생성
  const getComparisonMessage = () => {
    return null;

    if (comparisonValue === 0) return null;
    
    const { isPositive, text } = formatComparisonValue(comparisonValue);
    
    if (viewType === 'daily') {
      // 일간 뷰 비교 메시지
      return {
        prefix: isPositive ? "대단한데?" : "힘내!",
        message: `어제보다 ${text} ${isPositive ? "더" : "적게"} 채굴했어!!`
      };
    } else {
      // 주간 뷰 비교 메시지
      return {
        prefix: "",
        message: `전 주보다 ${text} ${isPositive ? "증가" : "감소"}했어요!`
      };
    }
  };

  // 통계 정보 준비
  const dailyProgress = calculateDailyProgress();
  const weeklyAverage = calculateWeeklyAverage();
  const motivationalMessage = getMotivationalMessage();
  const comparisonMessage = getComparisonMessage();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>채굴 시간</Text>
      </View>

      {/* 비교 메시지 (있는 경우만 표시) */}
      {comparisonMessage && viewType === 'weekly' && (
        <Text style={styles.comparisonText}>
          {comparisonMessage.message}
        </Text>
      )}

      {/* 채굴 시간 표시 */}
      <View style={styles.miningTimeContent}>
        <View style={styles.pickaxeContainer}>
          <Image
            source={require("../../assets/pickaxe.png")}
            style={styles.pickaxeIcon}
            resizeMode="contain"
          />
        </View>
        <View style={styles.miningTimeInfo}>
          <Text style={styles.miningTimeValue}>
            {viewType === 'weekly' && <Text style={styles.totalPrefix}>총</Text>}{' '}
            <Text style={styles.hoursText}>
              {totalMiningTime.hours}
            </Text>
            시간{' '}
            <Text style={styles.minutesText}>
              {totalMiningTime.minutes}
            </Text>
            분
          </Text>
        </View>
      </View>

      {/* 뷰 타입에 따른 추가 정보 */}
      {viewType === 'daily' ? (
        // 일간 뷰 추가 정보
        <>
          {/* 캐릭터와 비교 메시지 */}
          {comparisonMessage && (
            <View style={styles.characterContainer}>
              <Image
                source={require("../../assets/coin-character.png")}
                style={styles.characterImage}
                resizeMode="contain"
              />
              <View style={styles.characterBubble}>
                <Text style={styles.characterText}>
                  {comparisonMessage.prefix}
                </Text>
                <Text style={styles.characterText}>
                  {comparisonMessage.message}
                </Text>
              </View>
            </View>
          )}
          
          {/* 채굴 달성률 프로그레스 바 (선택 사항) */}
          <View style={styles.progressContainer}>
            <View style={styles.progressInfoRow}>
              <Text style={styles.progressLabel}>오늘 채굴</Text>
              <Text style={styles.progressValue}>{dailyProgress}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar,
                  { width: `${dailyProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressNote}>일일 최대 채굴 가능 시간: 8시간</Text>
          </View>
          
          {/* 동기 부여 메시지 */}
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationText}>{motivationalMessage}</Text>
          </View>
        </>
      ) : (
        // 주간 뷰 추가 정보
        <>
          {/* 주간 통계 정보 */}
          <View style={styles.weeklyStatsContainer}>
            <View style={styles.weeklyStatRow}>
              <View style={styles.weeklyStatItem}>
                <Text style={styles.weeklyStatLabel}>일 평균</Text>
                <Text style={styles.weeklyStatValue}>
                  {formatMiningTime(weeklyAverage.hours, weeklyAverage.minutes)}
                </Text>
              </View>
              
              <View style={styles.weeklyStatItem}>
                <Text style={styles.weeklyStatLabel}>채굴 완료 일수</Text>
                <Text style={styles.weeklyStatValue}>
                  {miningData?.filter(day => 
                    day.miningTime.totalMinutes > 0
                  ).length || 0}일
                </Text>
              </View>
            </View>
            
            {/* 동기 부여 메시지 */}
            <View style={styles.motivationContainer}>
              <Text style={styles.motivationText}>{motivationalMessage}</Text>
            </View>
          </View>
          
          {/* 일별 채굴 시간 목록 */}
          <View style={styles.dailyMiningContainer}>
            <Text style={styles.dailyMiningTitle}>날짜별 채굴 시간</Text>
            <View style={styles.dailyMiningList}>
              {miningData?.map((item, index) => {
                const hours = item.miningTime.hours;
                const minutes = item.miningTime.minutes;
                return (
                  <View key={index} style={styles.dailyMiningItem}>
                    <Text style={styles.dailyMiningDate}>
                      {`${item.month}/${item.day} (${item.dayOfWeek})`}
                    </Text>
                    <Text style={styles.dailyMiningTime}>
                      {formatMiningTime(hours, minutes)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
    marginTop: 0,
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
  },
  comparisonText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 15,
  },
  miningTimeContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  pickaxeContainer: {
    marginRight: 15,
  },
  pickaxeIcon: {
    width: 40,
    height: 40,
    transform: [{ rotate: "-30deg" }],
  },
  miningTimeInfo: {
    flex: 1,
  },
  miningTimeValue: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: 'right',
  },
  totalPrefix: {
    fontSize: 16,
    fontWeight: "500",
  },
  hoursText: {
    fontSize: 30,
    fontWeight: "bold",
  },
  minutesText: {
    fontSize: 30,
    fontWeight: "bold",
  },
  characterContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 10,
    marginTop: 5,
    marginBottom: 10,
  },
  characterImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  characterBubble: {
    flex: 1,
  },
  characterText: {
    fontSize: 14,
  },
  progressContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#FFF",
    borderRadius: 10,
  },
  progressInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 14,
    color: "#555",
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FF8C00",
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: "#F0F0F0",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 5,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FF8C00",
    borderRadius: 6,
  },
  progressNote: {
    fontSize: 12,
    color: "#888",
    textAlign: "right",
  },
  motivationContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#FFF",
    borderRadius: 10,
    alignItems: "center",
  },
  motivationText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    textAlign: "center",
  },
  weeklyStatsContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  weeklyStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  weeklyStatItem: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    backgroundColor: "#FFF",
    borderRadius: 10,
    marginHorizontal: 5,
  },
  weeklyStatLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 5,
  },
  weeklyStatValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  dailyMiningContainer: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  dailyMiningTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 10,
    textAlign: "center",
  },
  dailyMiningList: {
    marginTop: 5,
  },
  dailyMiningItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dailyMiningDate: {
    fontSize: 14,
    color: "#333",
  },
  dailyMiningTime: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
});

export default MiningStats;